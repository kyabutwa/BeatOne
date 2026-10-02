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
