# Test Coverage Analysis

## Current State: Zero Tests

This dotfiles repository has no tests. The only testing-adjacent artifact is the
`rspec` config file, which configures RSpec formatting for *other* Ruby projects
students work on — not for this repo itself.

---

## Proposed Test Areas

### 1. `install.sh` — Highest Priority

This is the most critical script. It mutates the user's home directory (backups,
symlinks, plugin installs). Bugs here break developer environments silently.

**Scenarios to test:**

| Scenario | Description |
|---|---|
| `backup()` with a real file | Should rename `target` → `target.backup` |
| `backup()` with a symlink | Should be a no-op (symlinks must not be moved) |
| `backup()` with a missing file | Should be a no-op |
| `symlink()` when link doesn't exist | Should create the symlink |
| `symlink()` when link already exists | Should be a no-op (idempotency) |
| Full install — dotfile loop | Each file (`aliases`, `gitconfig`, etc.) gets backed up and symlinked |
| VS Code path — macOS | Sets `CODE_PATH` to `~/Library/Application Support/Code/User` |
| VS Code path — Linux | Sets `CODE_PATH` to `~/.config/Code/User` |
| VS Code path — WSL | Falls back to `~/.vscode-server/data/Machine` when Linux path is absent |
| Idempotency | Running `install.sh` twice leaves the system in the same valid state |
| Plugin clone guard | `zsh-syntax-highlighting` is only cloned if the directory doesn't exist |

**Known bugs that tests would catch:**

- `install.sh:40` — clones `zsh-autosuggestions` unconditionally, but the `if`
  condition only checks for `zsh-syntax-highlighting`. Re-running the script will
  attempt to clone `zsh-autosuggestions` again.
- `install.sh:75` — `echo "👌 Carry on with git setup!"` is unreachable dead code
  because `exec zsh` on line 73 replaces the current process.

**Recommended tooling:** [bats-core](https://github.com/bats-core/bats-core)

Example test structure:

```bash
# tests/install.bats
setup() {
  export HOME="$(mktemp -d)"
  source "$BATS_TEST_DIRNAME/../install.sh" --source-only
}

@test "backup() moves a real file to .backup" {
  touch "$HOME/testfile"
  backup "$HOME/testfile"
  [ -f "$HOME/testfile.backup" ]
  [ ! -f "$HOME/testfile" ]
}

@test "backup() does not move a symlink" {
  ln -s /dev/null "$HOME/testlink"
  backup "$HOME/testlink"
  [ -L "$HOME/testlink" ]
  [ ! -f "$HOME/testlink.backup" ]
}

@test "symlink() creates a link when it does not exist" {
  local src="$(mktemp)"
  symlink "$src" "$HOME/mylink"
  [ -L "$HOME/mylink" ]
}

@test "symlink() is idempotent" {
  local src="$(mktemp)"
  symlink "$src" "$HOME/mylink"
  symlink "$src" "$HOME/mylink"  # second call must not error
  [ -L "$HOME/mylink" ]
}
```

---

### 2. `git_setup.sh` — Medium Priority

This script writes global git config and pushes. It is simple but interactive,
so tests should mock user input and git operations.

**Scenarios to test:**

| Scenario | Description |
|---|---|
| Sets `user.name` correctly | `git config --global user.name` is populated from piped input |
| Sets `user.email` correctly | `git config --global user.email` is populated from piped input |
| Handles names with spaces | Multi-word names are not truncated |
| Adds upstream remote | `git remote -v` shows `upstream` pointing to `lewagon/dotfiles` |

---

### 3. `zshrc` — Lower Priority

Shell configuration is difficult to unit test, but critical logic can be
validated by sourcing the file in a controlled environment.

**Scenarios to test:**

| Scenario | Description |
|---|---|
| `load-nvmrc` — no `.nvmrc` | Falls back to `nvm use default` |
| `load-nvmrc` — version matches | `nvm use` is not called |
| `load-nvmrc` — version differs | Calls `nvm use --silent` |
| `load-nvmrc` — version not installed | Calls `nvm install` |
| `aliases` file sourced | Verifies `~/.aliases` is loaded when present |
| PATH ordering | `./bin` and `./node_modules/.bin` appear before system paths |

**Known bug:** `zshrc:7` — `ssh.agent` is placed outside the `plugins=(...)` array.
It should be `plugins=(git gitfast last-working-dir common-aliases zsh-syntax-highlighting history-substring-search ssh-agent)`.
Tests sourcing zshrc in a mock environment would surface this immediately.

---

### 4. Static Analysis — Zero Effort, High Return

Add [ShellCheck](https://www.shellcheck.net/) to catch syntax errors and
anti-patterns in all shell scripts without writing any test cases.

ShellCheck would immediately flag:
- The unreachable `echo` after `exec zsh` in `install.sh`
- Unquoted variable expansions (e.g., `ln -s $file $link` on line 20 of `install.sh`)
- The `ssh.agent` placement issue in `zshrc`

---

### 5. CI Pipeline — Currently Missing

There is no CI pipeline. A minimal GitHub Actions workflow would catch
regressions automatically on every push.

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  shellcheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run ShellCheck
        uses: ludeeus/action-shellcheck@master
        with:
          scandir: '.'
          additional_files: 'zshrc zprofile aliases'

  bats:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install bats-core
        run: |
          sudo apt-get update
          sudo apt-get install -y bats
      - name: Run tests
        run: bats tests/
```

---

## Recommended Implementation Order

1. **Add ShellCheck** — catches multiple existing bugs with zero test-writing effort
2. **Add bats-core tests for `install.sh`** — covers `backup()`, `symlink()`, and idempotency
3. **Add GitHub Actions CI** — runs ShellCheck + bats on every push
4. **Add bats-core tests for `git_setup.sh`** — mock git operations with a temp HOME
5. **Add zshrc sourcing tests** — validate `load-nvmrc` logic and PATH setup

---

## Summary Table

| File | Current Coverage | Risk | Effort to Test |
|---|---|---|---|
| `install.sh` | None | High — mutates home directory | Medium (bats-core) |
| `git_setup.sh` | None | Medium — writes global git config | Low (bats-core + mocks) |
| `zshrc` | None | Medium — broken plugin line | Medium (bats-core) |
| `aliases` | None | Low | Low |
| Config files | N/A — declarative | Low | N/A |
