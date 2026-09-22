import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

const STROKE_STAGGER = 0.045;
const STROKE_DRAW_TIME = 1.25;
const OUTLINE_WIDTH = 7;
const SPOTLIGHT_PIN_HEIGHT = 4;
const STROKE_DRAW_ORDER = [0, 12, 2, 10, 4, 8, 6, 1, 3, 5, 7, 9, 11];

document.addEventListener("DOMContentLoaded", () => {
  const lenis = new Lenis();
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  const strokes = Array.from(document.querySelectorAll(".stroke")).map(
    (fill) => {
      const fillWidth = parseFloat(fill.getAttribute("stroke-width"));
      const outline = fill.cloneNode(true);
      outline.setAttribute("stroke", "#141414");
      fill.setAttribute("stroke-width", fillWidth - OUTLINE_WIDTH);
      fill.before(outline);

      const length = fill.getTotalLength();
      const layers = [outline, fill];
      layers.forEach((layer) => {
        layer.style.strokeDasharray = length;
        layer.style.strokeDashoffset = length;
      });
      return { layers, length };
    },
  );

  const sparkles = gsap.utils.toArray(".sparkle");
  const messageBefore = document.querySelector(".spotlight-content-in");
  const messageAfter = document.querySelector(".spotlight-content-out");

  const startTime = (order) => order * STROKE_STAGGER;
  const timingWobble = (order) => (order % 2 === 0 ? 0 : STROKE_STAGGER * 0.6);
  const drawDuration = (order) => STROKE_DRAW_TIME + (order % 3) * 0.12;

  const timeline = gsap.timeline();

  ScrollTrigger.create({
    trigger: ".spotlight",
    start: "top top",
    end: () => `+=${window.innerHeight * SPOTLIGHT_PIN_HEIGHT}px`,
    pin: true,
    pinSpacing: true,
    scrub: 1,
    animation: timeline,
  });

  const drawSteps = STROKE_DRAW_ORDER.map((strokeIndex, order) => ({
    strokeIndex,
    at: startTime(order) + timingWobble(order),
    duration: drawDuration(order),
  }));
  const coveredAt = Math.max(
    ...drawSteps.map((step) => step.at + step.duration),
  );

  drawSteps.forEach(({ strokeIndex, at, duration }) => {
    timeline.to(
      strokes[strokeIndex].layers,
      { strokeDashoffset: 0, duration, ease: "power2.out" },
      at,
    );
  });

  timeline.set(messageBefore, { opacity: 0 }, coveredAt);
  timeline.set(messageAfter, { opacity: 1 }, coveredAt);

  [...STROKE_DRAW_ORDER].reverse().forEach((strokeIndex, order) => {
    const { layers, length } = strokes[strokeIndex];
    timeline.to(
      layers,
      {
        strokeDashoffset: -length,
        duration: drawDuration(order),
        ease: "power2.in",
      },
      coveredAt + startTime(order) + timingWobble(order),
    );
  });

  sparkles.forEach((sparkle, index) => {
    const popAt = coveredAt - 0.4 + index * 0.25;
    timeline
      .fromTo(
        sparkle,
        { scale: 0, rotate: -60, transformOrigin: "center" },
        { scale: 1, rotate: 60, duration: 0.5, ease: "back.out(2)" },
        popAt,
      )
      .to(
        sparkle,
        { scale: 0, rotate: 140, duration: 0.5, ease: "back.in(2)" },
        popAt + 0.6,
      );
  });
});
