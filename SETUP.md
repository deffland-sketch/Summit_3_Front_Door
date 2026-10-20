# Setup: From Empty Repo to Overnight Build

Summit 3.0 Front Door · October 20, 2026 · For Dan

About fifteen minutes. Do the steps in order. Nothing here requires a terminal; the one optional terminal path is marked.

## 1. Create the Repository

1. Go to github.com, sign in, click the plus sign at top right, choose New repository.
2. Repository name: `summit-front-door`. Description: "Summit 3.0 learner front door prototype on a 100-student sandbox."
3. Set it to Private. Check "Add a README file." Leave .gitignore and license as None (Claude Code adds them). Click Create repository.

## 2. Add the Specs

Browser path (no terminal):

1. In the new repo, click Add file, then Upload files.
2. Drag in the file `00-CLAUDE.md` first. Before committing, click on its name in the upload list and rename it to `CLAUDE.md`. If the uploader does not allow renaming, upload it as is and rename it in step 5.
3. Commit with the message "Add CLAUDE.md."
4. Click Add file, then Create new file. In the name box type `specs/README.md` (typing the slash creates the folder). Put one line in the body: "Specs for the Summit 3.0 Front Door. Read in order." Commit.
5. Open the `specs` folder, click Add file, Upload files, and drag in the nine files `01-DATA-MODEL.md` through `10-KNOWLEDGE-GRAPH.md` (skip `00-CLAUDE.md` and this `SETUP.md`). Commit with the message "Add specs 01 to 10."
6. If `CLAUDE.md` is still named `00-CLAUDE.md` at the root, open it, click the pencil, change the filename at the top to `CLAUDE.md`, and commit.

Terminal path (optional, if you prefer):

```
git clone https://github.com/<your-username>/summit-front-door.git
cd summit-front-door
mkdir specs
cp /path/to/specs/01-*.md /path/to/specs/02-*.md ... specs/
cp /path/to/specs/00-CLAUDE.md CLAUDE.md
git add . && git commit -m "Add CLAUDE.md and specs 01 to 10" && git push
```

## 3. Connect Claude Code on the Web

1. Go to claude.ai/code and sign in with the same account you use here.
2. The first time, it asks to install the Claude GitHub app. Install it and grant access to `summit-front-door` only.
3. Pick `summit-front-door` as the repository. Leave the default cloud environment with internet access on, because Phase 2 tries to fetch the Learning Commons exports and Phase 0 installs npm packages.
4. Choose the highest effort setting the picker offers.

## 4. Start the Run

1. Paste the Claude Code prompt from the chat into the task box. Send it.
2. Watch the first five minutes: it should read CLAUDE.md and the specs, then scaffold. If it asks you a question in the first few minutes, reply with one line: "Decide it yourself, record it in DECISIONS.md, and keep going."
3. Close the laptop. The session runs in Anthropic's cloud.

## 5. In the Morning

1. Open claude.ai/code and find the session. It should end at a pull request titled "Front Door prototype v1."
2. Read `DECISIONS.md` and `QUESTIONS.md` in the PR first. The questions are the product calls it made for you.
3. Merge the PR, or open it in the Claude desktop app (Code tab, open the repo folder) to review diffs and run the app with `npm install && npm run dev`.
4. Follow the demo script in the README. If the app runs and the demo script holds, deploy: go to vercel.com, New Project, import `summit-front-door`, accept the Vite defaults, Deploy.

## If It Stalls

- A cloud session that ran out of its turn budget shows a partial branch. Start a new session with: "Continue the build from the last commit. Read DECISIONS.md and QUESTIONS.md, then resume at the first unfinished phase in specs/09-BUILD-PLAN.md. Same rules: never stop to ask."
- A red build at the end: paste the failing output into a new session with "Fix the build without changing any spec. Record what you changed in DECISIONS.md."
- Anything you would rather start over: delete the branch, keep `main`, start again. The specs are the asset.
