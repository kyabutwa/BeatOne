import test from "node:test";
import assert from "node:assert/strict";
import { renderHome } from "../src/home-ui.js";

test("authentication form uses canonical id selectors", async () => {
  const response = renderHome(() => new Headers());
  const html = await response.text();

  assert.match(html, /const body=\{email:\$\("email"\)\.value\.trim\(\),password:\$\("password"\)\.value\}/);
  assert.match(html, /body\.name=\$\("name"\)\.value\.trim\(\)/);
  assert.match(html, /body\.phone=\$\("phone"\)\.value\.trim\(\)/);
  assert.doesNotMatch(html, /\$\("#(?:email|password|name|phone)"\)/);
  assert.match(html, /\/api\/auth\/sign-in\/email/);
  assert.match(html, /\/api\/auth\/sign-up\/email/);
});

test("Zalagren shell enforces the canonical visual contract", async () => {
  const response = renderHome(() => new Headers());
  const html = await response.text();

  assert.match(html, /src="\/zalagren-emblem\.png"/);
  assert.doesNotMatch(html, /src="\/1\.png"/);
  assert.match(html, /body\.navy-mode \.topbar,body\.navy-mode \.bottom-nav[\s\S]*background:#061a33!important/);
  assert.match(html, /\.surface[\s\S]*background:#0b2a52!important/);
  assert.match(html, /\.surface \*[\s\S]*color:#fff!important/);
  assert.match(html, /html,body\{background:var\(--canvas\)!important;color:var\(--text\)!important\}/);
  assert.doesNotMatch(html, /BeatOne/);
  assert.doesNotMatch(html, /EarthBeat/);
});

test("browser script contains no TypeScript-only syntax", async () => {
  const response = renderHome(() => new Headers());
  const html = await response.text();
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join("\n");

  assert.doesNotMatch(scripts, /\(p:any\)|\(f:any\)|\(b:any\)/);
  assert.doesNotMatch(scripts, /\)\s+as\s+HTMLInputElement/);
  assert.match(html, /id="inviteModal"/);
  assert.match(html, /id="inviteSend"/);
  assert.match(html, /fetch\("\/api\/invite"/);
});


test("rendered browser scripts are valid JavaScript", async () => {
  const response = renderHome(() => new Headers());
  const html = await response.text();
  const scripts = [...html.matchAll(/<script>([\\s\\S]*?)<\\/script>/g)].map(m => m[1]);
  assert.ok(scripts.length >= 2);
  for (const script of scripts) {
    assert.doesNotThrow(() => new Function(script));
  }
});
