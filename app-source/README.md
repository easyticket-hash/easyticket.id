# EasyTicket — customer-facing source snapshot

Public page markup, styling, browser scripts, and view templates corresponding to EasyTicket release 117. Includes the destination booking form and its customer email OTP interface, plus public merchant registration UI.

## Contents

- `site-pages/`: homepage, explore, promotion, blog, about, technology, and merchant public pages.
- `public/`: styles and browser-side scripts used by those pages, including OTP form interactions.
- `routes/`: thin route wrappers serving public pages.
- `templates/`: dynamic destination, booking status, and article view templates with placeholders.

The browser UI calls the production site's `/api/...` endpoints. API implementations, database and migrations, private configuration, admin and merchant operational dashboards, and binary image assets are not included in this public source snapshot. Live site: https://easyticket-explore-book.khairani0894.chatgpt.site/?release=117.
