# Checkout control oracle

Method: read `fixtures/shop/control/index.html` and `fixtures/shop/shop.js` and walk the keyboard by hand. This file was written before the browser runner. Roles below are the HTML/ARIA roles of the controls that receive focus. On the control build the accessible name is the label text or the button's own text.

Starting point: `data-app-ready` becomes `true` and `data-app-state` becomes `browsing` at the end of `shop.js`. Focus is the document body. The status live region is empty.

Tab order before a search: `#q` (search box, name "Search products"), `#cart` (button, name "Cart"), `#place` (button, name "Place demo order."). The heading, label, status, list, and dialog are not in the tab order. The dialog is closed.

| Step | Action | Why this node | Role | Name | Focus id | Status | App state |
| --- | --- | --- | --- | --- | --- | --- | --- |
| focus-search | Tab once | The search box is the first tab stop | searchbox | Search products | q | empty | browsing |
| type-query | Type the synthetic text `pen` | Focus stays in the box. The text is declared by the journey, not captured from a person | searchbox | Search products | q | empty | browsing |
| submit-search | Enter | The input is inside the form, so Enter submits. The script appends one "Add pen" button and sets the status. Focus remains in the box | searchbox | Search products | q | 1 result for pen. | results |
| focus-add | Tab once | The new button sits between the box and Cart | button | Add pen | add-pen | 1 result for pen. | results |
| open-cart | Enter | The button's click handler opens the modal and moves focus to Close cart | button | Close cart | close-cart | Pen added. | cart-open |
| escape-cart | Escape | The cancel handler closes the dialog. The browser returns focus to Add pen, the button that opened it | button | Add pen | add-pen | Pen added. | browsing |
| reach-checkout | Tab until `#place`, at most 8 | From Add pen the stops are Cart, then Place demo order. Two tabs are enough | button | Place demo order. | place | Pen added. | browsing |
| submit-order | Enter | The checkout button records a dummy order in the status text. Nothing is sent anywhere | button | Place demo order. | place | Demo order recorded. | submitted |

The machine-readable copy of this table is `checkout-control.json`. A passing normalized trace matches that copy with run ids omitted.

## Seeded outcomes, also by hand

These are the first disagreements with the control trace. Later checkpoints are not part of the verdict once a step has failed.

- **name-mutant.** The button `#place` has no text. The words "Place demo order." sit on a sibling span with `aria-hidden="true"`, painted over the same button box. Step `reach-checkout` still focuses `#place`. The accessible name is empty. Category `evaluated_regression`.
- **focus-mutant.** Escape blurs the active element after the dialog closes, so focus is the document body (`focusId` `body`) instead of the opening button `#add-pen` (name "Add pen"). The visible cart copy does not change. Category `evaluated_regression` at step `escape-cart`.
- **tab-loop.** Two buttons, Offer A and Offer B, sit before checkout and capture Tab. Eight tabs do not focus `#place`. Category `tab_limit` at step `reach-checkout`.
- **timeout.** `data-app-ready` stays `false`. The runner stops before any semantic comparison. Category `application_timeout`.
- **unsupported.** `unsupported.journey.json` asks for a screen-reader announcement at `focus-search`. The runner can record the search box and must not score that speech as a regression. Category `unsupported_observation`.

`invalid-action.journey.json` is the labeled invalid fixture. Its action is `click`. The validator rejects it as `unapproved_action` and does not start a browser. `invalid-external.journey.json` names `https://example.com` and is rejected as `external_navigation`.
