<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Classroom reads paginate each collection with bounded item/request limits and reject incomplete or failed collections instead of returning partial success, so imports never imply missing data is absent.
- Exams live in the same localStorage data object (`exams`, defaulting to []) so older saved data stays valid; Google Calendar is not integrated because the app has no user accounts, so a server route would expose a calendar publicly.
- Home-screen metadata uses the supplied manifest and embedded icon route; keep the existing localStorage identifiers unchanged to preserve saved data. Offline caching must follow the platform PWA skill, not a hand-written service worker.
