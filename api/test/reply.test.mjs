/**
 * Keeping the machinery out of the answer.
 *
 * The persona asks for `navigate_to_slide` because the voice endpoint offers
 * that tool; this endpoint usually does not, so the model performs the call in
 * prose instead. ask.mjs now tells it not to bother — these cases are the net
 * under that, and they are the reason the net is not optional.
 *
 * Measured against the live broker over five questions, the call arrived in
 * five different shapes, including one spelled in English with the answer on
 * the same line, and one that was the entire reply and named no id at all.
 *
 * The samples below are verbatim from that run. They are the reason this file
 * exists, so they are pinned rather than paraphrased.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { extractNavigation } from "../src/shared/reply.mjs";

const SLIDES = [
  { id: "contact", title: "yuxianghuang2026@gmail.com" },
  { id: "rivulet-localops", title: "Rivulet LocalOps" },
  { id: "rivulet-localops-highlight-1", title: "Rivulet LocalOps" },
  { id: "internships-china", title: "Internships in China" },
  { id: "experience-index", title: "Work & Experience" },
  { id: "work-tencent-work-1", title: "Tencent" },
];

test("the call-as-prose forms seen in the wild are removed, and their destination kept", () => {
  const cases = [
    {
      raw: "navigate_to_slide(contact)\nEvan is currently interning at Strategy&Ops Consultancy.",
      slideId: "contact",
      reply: "Evan is currently interning at Strategy&Ops Consultancy.",
    },
    {
      raw: "[navigate_to_slide: rivulet-localops]\nRivulet LocalOps is a policy-gated system.",
      slideId: "rivulet-localops",
      reply: "Rivulet LocalOps is a policy-gated system.",
    },
    {
      raw: "navigate_to_slide([experience, internships-china])\nHe analysed win rates and pick rates.",
      slideId: "internships-china",
      reply: "He analysed win rates and pick rates.",
    },
    {
      raw: 'Navigate to slide "contact": {"slide_id": "contact"}\nEmail him.',
      slideId: "contact",
      reply: "Email him.",
    },
    /*
     * The answer shares the line with the call, so the call's own sentence has
     * to go and not the line it sits in. Dropping the line would delete the
     * reply.
     */
    {
      raw: "Navigate to slide [work-tencent-work-1]. At Tencent, Evan analysed win rates.",
      slideId: "work-tencent-work-1",
      reply: "At Tencent, Evan analysed win rates.",
    },
  ];

  for (const c of cases) {
    const out = extractNavigation(c.raw, SLIDES);
    assert.equal(out.reply, c.reply, `reply for: ${c.raw.split("\n")[0]}`);
    assert.equal(out.slideId, c.slideId, `destination for: ${c.raw.split("\n")[0]}`);
    assert.ok(!/navigate_to_slide/i.test(out.reply), "the tool name must never reach the visitor");
  }
});

test("an ordinary answer is returned untouched", () => {
  const raw = "He studies Information Technology and Systems at the University of Tasmania.";
  assert.deepEqual(extractNavigation(raw, SLIDES), { reply: raw, slideId: null });
});

test("a multi-line answer keeps its paragraphs", () => {
  const raw = "navigate_to_slide(contact)\nFirst paragraph.\n\nSecond paragraph.";
  const out = extractNavigation(raw, SLIDES);
  assert.equal(out.reply, "First paragraph.\n\nSecond paragraph.");
});

test("a slide the catalogue does not have is not navigated to", () => {
  const out = extractNavigation("navigate_to_slide(atlantis)\nNo such place.", SLIDES);
  assert.equal(out.slideId, null, "an invented id must not become a destination");
  assert.equal(out.reply, "No such place.", "but the machinery still goes");
});

test("the first real destination wins when a reply names several", () => {
  const raw = "navigate_to_slide(contact)\nSomething.\nnavigate_to_slide(rivulet-localops)\nMore.";
  const out = extractNavigation(raw, SLIDES);
  assert.equal(out.slideId, "contact");
  assert.equal(out.reply, "Something.\nMore.");
});

test("nothing in, nothing out", () => {
  assert.deepEqual(extractNavigation("", SLIDES), { reply: "", slideId: null });
  assert.deepEqual(extractNavigation(null, SLIDES), { reply: "", slideId: null });
});

test("a call that names only a title still finds its slide", () => {
  /* Measured: this was the entire reply, with no id and no answer in it. */
  const out = extractNavigation('Navigate to slide 15, "Rivulet LocalOps".', SLIDES);
  assert.equal(out.slideId, "rivulet-localops");
  assert.equal(out.reply, "", "nothing was said, so ask.mjs supplies the line");
});

test("prose that merely mentions slides is left alone", () => {
  const raw = "He built the deck so every slide renders twice.";
  assert.deepEqual(extractNavigation(raw, SLIDES), { reply: raw, slideId: null });
});
