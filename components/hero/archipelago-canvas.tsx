"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import * as THREE from "three";
import gsap from "gsap";
import { buildPoints } from "@/lib/archipelago";
import {
  BG_EVENT,
  D,
  E,
  E_INOUT,
  SHOWCASE,
  type AttractDetail,
  type ShowcaseDetail,
} from "@/lib/motion";
import { DESKTOP_QUERY, panelScroller } from "@/lib/scroller";

/**
 * The Archipelago — a GPU point cloud that resolves out of a drifting field
 * into a chain of islands on the right of the window, breathes at rest, parts
 * around the pointer, and drifts gently as the page scrolls. It also answers
 * the motion layer (lib/motion.ts, BG_EVENT): it loosens as a page leaves
 * and resolves as the next arrives, leans toward the card or button under
 * the pointer, and ripples when the page is scrolled fast.
 *
 * Since 2026-09-11 it is the background of every page: mounted once in
 * app/layout.tsx as a fixed, full-window layer behind the shell, so it
 * survives route changes instead of re-initialising. Because that layer is
 * `pointer-events: none`, the pointer is read from the window, not the
 * canvas.
 *
 * Written against three.js directly rather than react-three-fiber. For one
 * point cloud the reconciler earns nothing and costs a second runtime
 * against a 500KB lazy-chunk budget. One geometry, one material, one draw
 * call.
 *
 * Guards live in `archipelago.tsx`, which decides whether to mount this at
 * all — reduced motion, absent WebGL and Save-Data never reach this file.
 * The canvas is decorative: `aria-hidden`, never focusable.
 */

const VERT = /* glsl */ `
  uniform float uProgress;
  uniform float uTime;
  uniform vec2  uMouse;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec2  uAttract;
  uniform float uPull;
  uniform float uRipple;
  uniform float uReach;
  uniform float uPush;

  attribute vec3  aTarget;
  attribute vec3  aScatter;
  attribute float aSeed;

  varying float vRamp;
  varying float vFade;

  void main() {
    // Per-point delay, so the field resolves as a wave rather than a snap.
    float delayed = clamp((uProgress - aSeed * 0.35) / 0.65, 0.0, 1.0);
    float eased = delayed * delayed * (3.0 - 2.0 * delayed);

    vec3 pos = mix(aScatter, aTarget, eased);

    // Breathing — slow, small, and scaled by how resolved the field is.
    // Idle speeds raised twice on 2026-09-13 (Jan: "a little faster", then "a little more"); amplitudes unchanged.
    float breathe = sin(uTime * 0.8 + aSeed * 6.2831) * 0.045 * eased;
    pos.xy += normalize(pos.xy + 0.0001) * breathe;
    pos.z += sin(uTime * 0.65 + aSeed * 12.0) * 0.05 * eased;

    // Pointer repulsion, damped by distance. Only meaningful once resolved.
    // uReach is the radius (a mouse 1.05, a fingertip on a phone less);
    // uPush fades a touch in and out in place. Never tween uReach to 0 —
    // smoothstep with equal edges divides by zero.
    // The push scales with the reach (0.42 at the mouse's 1.05), so a
    // fingertip gets the same soft dent, only smaller. A fixed 0.42 in a 0.6
    // radius pushed points 70% of the way out and cut a hard empty disc with
    // a piled-up rim (R18, by eye).
    vec2 away = pos.xy - uMouse;
    float d = length(away);
    float push = smoothstep(uReach, 0.0, d) * 0.4 * uReach * uPush * eased;
    pos.xy += normalize(away + 0.0001) * push;

    // Lean toward the hovered card or button — a soft pull, never a snap.
    vec2 toward = uAttract - pos.xy;
    float reach = smoothstep(3.4, 0.0, length(toward));
    pos.xy += toward * reach * 0.16 * uPull * eased;

    // Ripple — a fast scroll sends a wave through the chain.
    pos.y += sin(pos.x * 2.4 + uTime * 5.0 + aSeed * 3.0) * 0.07 * uRipple;
    pos.z += sin(pos.y * 3.0 - uTime * 6.0) * 0.14 * uRipple;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    // Two-tone by a per-point hash, so accent and sand mix through the
    // chain instead of banding.
    vRamp = fract(aSeed * 7.13);
    vFade = eased;

    gl_PointSize = uSize * uPixelRatio * (1.0 / -mv.z);
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;

  uniform vec3  uColorA;
  uniform vec3  uColorB;
  uniform float uOpacity;

  varying float vRamp;
  varying float vFade;

  void main() {
    // Soft round point. Normal blending — additive blows out on the light
    // ground.
    float d = length(gl_PointCoord - 0.5);
    float alpha = smoothstep(0.5, 0.12, d);
    if (alpha < 0.01) discard;

    vec3 color = mix(uColorA, uColorB, step(0.62, vRamp));
    gl_FragColor = vec4(color, alpha * uOpacity * mix(0.35, 1.0, vFade));
  }
`;

function cssColor(name: string, fallback: string) {
  if (typeof window === "undefined") return new THREE.Color(fallback);
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  try {
    return new THREE.Color(raw || fallback);
  } catch {
    return new THREE.Color(fallback);
  }
}

const FOV = 42;
const CAM_Z = 6.2;

/** Repulsion radius, in world units. A 390px phone is only ~2.2 units wide,
 *  so the mouse radius would bulge most of the screen from one fingertip;
 *  the touch radius is sized to clear the finger rather than hide under it. */
const MOUSE_REACH = 1.05;
const TOUCH_REACH = 0.6;

/** Visible half-extent, in world units, at the z = 0 plane. */
function halfExtent(aspect: number) {
  const halfH = Math.tan((FOV * Math.PI) / 360) * CAM_Z;
  return { halfW: halfH * aspect, halfH };
}

export default function ArchipelagoCanvas() {
  const host = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  // Inner pages carry more text over the field than the home page does, so
  // the points sit fainter there (Jan, 2026-09-11: readability).
  const levelRef = useRef(pathname === "/" ? 1 : 0.6);
  const opacityRef = useRef<{ value: number } | null>(null);
  const baseRef = useRef(0.5);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    const mobile = window.matchMedia("(max-width: 640px)").matches;
    const count = mobile ? 12000 : 30000;

    let aspect = el.clientWidth / Math.max(el.clientHeight, 1);
    let builtAspect = aspect;
    const first = halfExtent(aspect);
    const field = buildPoints(count, first.halfW, first.halfH);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(el.clientWidth, el.clientHeight, false);
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    el.appendChild(renderer.domElement);
    // Tells the page the canvas is live, so controls for it (the /lab
    // "Watch it assemble" button, `.bg-live-only`) can show. Removed on
    // unmount.
    document.documentElement.dataset.archipelago = "live";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, aspect, 0.1, 100);
    camera.position.set(0, 0, CAM_Z);

    const geometry = new THREE.BufferGeometry();
    // `position` is required by three even though the shader uses aTarget /
    // aScatter — seed it with the scattered state.
    const aScatter = new THREE.BufferAttribute(field.scatter, 3);
    const aTarget = new THREE.BufferAttribute(field.target, 3);
    geometry.setAttribute("position", aScatter);
    geometry.setAttribute("aScatter", aScatter);
    geometry.setAttribute("aTarget", aTarget);
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(field.seed, 1));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 40);

    const uniforms = {
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(99, 99) },
      uAttract: { value: new THREE.Vector2(0, 0) },
      uPull: { value: 0 },
      uRipple: { value: 0 },
      uReach: { value: MOUSE_REACH },
      uPush: { value: 1 },
      // World-scaled point size (÷ depth ≈ 6.2): ~2.6px on desktop, ~2.1px
      // on phones — present, but a background, not a feature.
      uSize: { value: mobile ? 13 : 16 },
      uPixelRatio: { value: renderer.getPixelRatio() },
      // Lower on phones: there the chain is centred, behind the copy.
      uOpacity: { value: (mobile ? 0.35 : 0.5) * levelRef.current },
      uColorA: { value: cssColor("--accent", "#0b6e5c") },
      uColorB: { value: cssColor("--sand", "#b3813f") },
    };

    opacityRef.current = uniforms.uOpacity;
    baseRef.current = mobile ? 0.35 : 0.5;

    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // ── theme: re-read the tokens when `.dark` flips ──────────────────
    const themeObserver = new MutationObserver(() => {
      uniforms.uColorA.value = cssColor("--accent", "#0b6e5c");
      uniforms.uColorB.value = cssColor("--sand", "#b3813f");
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // ── pointer and touch — from the window; the layer takes neither ──
    // A mouse and a finger both part the islands, on every page (R19; R18 had
    // touch in the /lab showcase only). They take different event paths, and
    // that is load-bearing:
    //   · mouse → pointer events, filtered to pointerType "mouse";
    //   · touch → touch events, passive.
    // Not pointer events for touch: on an ordinary page the browser owns
    // panning, and the moment a drag becomes a scroll it fires pointercancel
    // and stops the pointer stream — the hole would appear on touchdown and
    // die a few pixels into every scroll. Touch events keep firing through a
    // scroll, and passive listeners can never delay it. Split by input, never
    // by media query: a touch laptop or an iPad with a trackpad sends both.
    const pointerFine = window.matchMedia("(pointer: fine)").matches;
    const mouseTarget = new THREE.Vector2(99, 99);
    const OFF = 99;
    // The showcase flag, set by onShowcase further down.
    let showing = false;
    // One tracked finger; a second (a pinch) is ignored.
    let touchId: number | null = null;
    const touchAt = { x: 0, y: 0 };

    function toField(
      clientX: number,
      clientY: number,
      v: THREE.Vector2,
      undoDrift: boolean,
    ) {
      const { halfW, halfH } = halfExtent(aspect);
      const nx = (clientX / window.innerWidth) * 2 - 1;
      const ny = -((clientY / window.innerHeight) * 2 - 1);
      // Touch undoes the field's scroll drift, as onAttract does, or the
      // hole sits beside the finger on a scrolled phone page. The mouse keeps
      // its original mapping so desktop behaves exactly as before.
      v.set(nx * halfW, ny * halfH - (undoDrift ? points.position.y : 0));
    }

    // A touch fades in and out where the finger is. The mouse path eases
    // uMouse toward its target from wherever it was, which is right for a
    // cursor entering from an edge but, for a finger landing mid-screen, would
    // fly the hole in from far off-screen and fly it back out on lift.
    function releaseTouch() {
      if (touchId === null) return;
      touchId = null;
      gsap.to(uniforms.uPush, {
        value: 0,
        duration: D.base,
        ease: E_INOUT,
        overwrite: true,
        onComplete: () => {
          mouseTarget.set(OFF, OFF);
          uniforms.uMouse.value.set(OFF, OFF);
          uniforms.uReach.value = MOUSE_REACH;
          uniforms.uPush.value = 1;
        },
      });
    }
    function onTouchStart(e: TouchEvent) {
      if (touchId !== null) return;
      const t = e.changedTouches[0];
      if (!t) return;
      touchId = t.identifier;
      touchAt.x = t.clientX;
      touchAt.y = t.clientY;
      toField(t.clientX, t.clientY, mouseTarget, true);
      uniforms.uMouse.value.copy(mouseTarget);
      uniforms.uReach.value = TOUCH_REACH;
      gsap.fromTo(
        uniforms.uPush,
        { value: 0 },
        { value: 1, duration: D.fast, ease: E, overwrite: true },
      );
    }
    function tracked(list: TouchList) {
      for (let i = 0; i < list.length; i++) {
        if (list[i].identifier === touchId) return list[i];
      }
      return null;
    }
    function onTouchMove(e: TouchEvent) {
      const t = touchId === null ? null : tracked(e.changedTouches);
      if (!t) return;
      touchAt.x = t.clientX;
      touchAt.y = t.clientY;
    }
    function onTouchEnd(e: TouchEvent) {
      if (touchId !== null && tracked(e.changedTouches)) releaseTouch();
    }
    function onPointerMove(e: PointerEvent) {
      if (e.pointerType !== "mouse" || !pointerFine || touchId !== null) return;
      uniforms.uReach.value = MOUSE_REACH;
      toField(e.clientX, e.clientY, mouseTarget, false);
    }
    function onPointerOut(e: PointerEvent) {
      if (e.pointerType === "mouse" && !e.relatedTarget) mouseTarget.set(OFF, OFF);
    }
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerout", onPointerOut);

    // ── scroll — a gentle drift, from whichever element scrolls ────────
    // Desktop: the panel (lib/scroller.ts). Below lg: the window. Scroll
    // events from the panel do not bubble, so listen in the capture phase.
    const desktop = window.matchMedia(DESKTOP_QUERY);
    let drift = 0;
    // Ripple from scroll speed: px per ms, eased toward 0 in the tick.
    let ripple = 0;
    let lastTop = 0;
    let lastT = performance.now();
    function onScroll() {
      const panel = desktop.matches ? panelScroller() : null;
      const top = panel ? panel.scrollTop : window.scrollY;
      const max = panel
        ? panel.scrollHeight - panel.clientHeight
        : document.documentElement.scrollHeight - window.innerHeight;
      drift = max > 0 ? top / max : 0;
      const now = performance.now();
      const speed = Math.abs(top - lastTop) / Math.max(now - lastT, 16);
      ripple = Math.max(ripple, Math.min(1, speed / 2.5));
      lastTop = top;
      lastT = now;
    }
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });

    // ── resize — re-lay the islands when the window changes shape ─────
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = Math.max(el.clientHeight, 1);
      aspect = w / h;
      renderer.setSize(w, h, false);
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      if (Math.abs(aspect / builtAspect - 1) > 0.12) {
        const { halfW, halfH } = halfExtent(aspect);
        const next = buildPoints(count, halfW, halfH);
        (aTarget.array as Float32Array).set(next.target);
        (aScatter.array as Float32Array).set(next.scatter);
        aTarget.needsUpdate = true;
        aScatter.needsUpdate = true;
        builtAspect = aspect;
      }
    });
    ro.observe(el);

    // ── the motion layer's events ─────────────────────────────────────
    const attractTarget = new THREE.Vector2(0, 0);
    let pullTarget = 0;
    function onAttract(e: Event) {
      const d = (e as CustomEvent<AttractDetail>).detail;
      if (!d) {
        pullTarget = 0;
        return;
      }
      const { halfW, halfH } = halfExtent(aspect);
      attractTarget.set(
        ((d.x / window.innerWidth) * 2 - 1) * halfW,
        // In the field's own space: undo its scroll drift.
        -((d.y / window.innerHeight) * 2 - 1) * halfH - points.position.y,
      );
      pullTarget = 1;
    }
    function onScatter() {
      gsap.to(uniforms.uProgress, {
        value: 0.55,
        duration: D.fast,
        ease: "power2.in",
        overwrite: true,
      });
    }
    function onGather() {
      gsap.to(uniforms.uProgress, {
        value: 1,
        duration: D.slow,
        ease: E,
        overwrite: true,
      });
    }
    // The /lab showcase. The shell has been dimmed out of the way, so the
    // field comes up to near-full strength and resolves from nothing — the
    // whole load-time resolve, not the 0.55 → 1 tail a page transition plays.
    // `overwrite` on every tween: the route-change effect below animates the
    // same opacity uniform, and two tweens on one property fight.
    const SHOW_OPACITY = 0.95;
    function onShowcase(e: Event) {
      const on = (e as CustomEvent<ShowcaseDetail>).detail?.on ?? false;
      if (on) {
        showing = true;
        pullTarget = 0;
        gsap.to(uniforms.uOpacity, {
          value: SHOW_OPACITY,
          duration: SHOWCASE.in / 1000,
          ease: E,
          overwrite: true,
        });
        gsap.set(uniforms.uProgress, { value: 0, overwrite: true });
        // In-out, not E: over five seconds expo.out lands the resolve in
        // about one and then stalls. See SHOWCASE in lib/motion.ts.
        gsap.to(uniforms.uProgress, {
          value: 1,
          duration: SHOWCASE.assemble / 1000,
          ease: E_INOUT,
          delay: SHOWCASE.in / 1000,
        });
        return;
      }
      if (!showing) return;
      showing = false;
      // A finger still down when the show ends must not leave a hole in the
      // chain behind the returning page.
      releaseTouch();
      // Finish the resolve if the reader left early, so the field is never
      // left half-formed behind the page.
      gsap.to(uniforms.uProgress, {
        value: 1,
        duration: SHOWCASE.out / 1000,
        ease: E_INOUT,
        overwrite: true,
      });
      // Same duration and curve as the shell's return in tokens.css, so the
      // field and the page cross-fade together.
      gsap.to(uniforms.uOpacity, {
        value: baseRef.current * levelRef.current,
        duration: SHOWCASE.out / 1000,
        ease: E_INOUT,
        overwrite: true,
      });
    }
    window.addEventListener(BG_EVENT.attract, onAttract);
    window.addEventListener(BG_EVENT.scatter, onScatter);
    window.addEventListener(BG_EVENT.gather, onGather);
    window.addEventListener(BG_EVENT.showcase, onShowcase);

    let hidden = document.hidden;
    const onVisibility = () => {
      hidden = document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibility);

    // THREE.Timer, not the deprecated THREE.Clock; it needs update() per frame.
    const timer = new THREE.Timer();
    const tick = () => {
      if (hidden) return;
      timer.update();
      uniforms.uTime.value = timer.getElapsed();
      // A held finger is re-mapped every frame, not only when a touchmove
      // arrives: the field keeps drifting after a scroll, and a finger resting
      // still would otherwise watch its hole slide out from under it.
      if (touchId !== null) toField(touchAt.x, touchAt.y, mouseTarget, true);
      uniforms.uMouse.value.lerp(mouseTarget, 0.12);
      uniforms.uAttract.value.lerp(attractTarget, 0.14);
      uniforms.uPull.value += (pullTarget - uniforms.uPull.value) * 0.06;
      uniforms.uRipple.value += (ripple - uniforms.uRipple.value) * 0.12;
      ripple *= 0.9;
      // Drift: the field rises and turns a touch as the page scrolls.
      points.position.y += (drift * 0.9 - points.position.y) * 0.09;
      points.rotation.z += (drift * 0.05 - points.rotation.z) * 0.09;
      renderer.render(scene, camera);
    };
    gsap.ticker.add(tick);

    // ── choreography — the field resolves once, on load ───────────────
    const intro = gsap.to(uniforms.uProgress, {
      value: 1,
      duration: D.slow * 1.4,
      ease: E,
      delay: 0.1,
    });

    return () => {
      intro.kill();
      gsap.ticker.remove(tick);
      ro.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener(BG_EVENT.attract, onAttract);
      window.removeEventListener(BG_EVENT.scatter, onScatter);
      window.removeEventListener(BG_EVENT.gather, onGather);
      window.removeEventListener(BG_EVENT.showcase, onShowcase);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerout", onPointerOut);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      delete document.documentElement.dataset.archipelago;
    };
  }, []);

  // Route change: ease the field to the new page's level.
  useEffect(() => {
    levelRef.current = pathname === "/" ? 1 : 0.6;
    if (!opacityRef.current) return;
    gsap.to(opacityRef.current, {
      value: baseRef.current * levelRef.current,
      duration: D.base,
      ease: E,
      overwrite: true,
    });
  }, [pathname]);

  return <div ref={host} aria-hidden="true" className="h-full w-full" />;
}