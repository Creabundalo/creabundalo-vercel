# M24 Backtest / No-Lookahead Contract v0.1

## Purpose
M24 must evaluate historical decisions as if it were standing at decision time `T`. Later price action may score the decision, but may never alter the decision snapshot or action candidate.

Core sequence:

`KNOWN_AT_T → DECISION_SNAPSHOT → ACTION_CANDIDATE → time passes → BACKTEST_OUTCOME → CALIBRATION`

v0.1 remains `SIMULATED_ONLY` and never submits a broker order.

## Decision time
For `BTC-2021-2022-TOP-MARKDOWN`, the default decision time is the **resolved second-top date**, not the end of the broad second-top search window.

This matters because a semantic window may extend after the actual resolved market checkpoint. Information published after the resolved checkpoint is future information for that decision and must be excluded.

## Admissible information
A `DECISION_SNAPSHOT` may contain only information provably available by `asOf`.

Current admissible layers:
- price structure measured at/before resolved second top
- meaning-world source items with `publishedAt <= asOf`
- funding aggregates explicitly bounded by resolved checkpoint dates
- Binance Vision checkpoint observations dated `<= asOf`
- macro observations whose selected observation date is `<= asOf`

Aggregated data without an auditable cutoff is rejected instead of assumed safe.

## Explicitly excluded future information
The decision snapshot excludes later scoring fields such as:
- first support break after the decision
- post-decision trough date/price
- drawdown from the second high
- later narrative/source items
- later macro observations

These belong only in `BACKTEST_OUTCOME`.

## Qubus records
The historical evaluation creates separate first-class records:

- `DECISION_SNAPSHOT`
- `ACTION_CANDIDATE`
- `BACKTEST_OUTCOME`

Changing the later outcome must not change the earlier snapshot or candidate.

## Candidate semantics
The first v0.1 candidate score is an auditable test harness, not a calibrated trading model. It can use measured evidence such as:
- weaker participation at the second top
- measured RSI divergence only when actually present
- bullish meaning-world + checkpoint-bounded positive funding crowding
- archived long/short skew at the checkpoint
- stronger dollar / tighter financial conditions observed by the checkpoint

Rejected evidence stays rejected. In the current weekly BTC regression case, the rejected RSI bearish-divergence hypothesis cannot contribute to the candidate score.

Candidate states:
- `INSUFFICIENT_CONTEXT`
- `WAIT`
- `DOWNSIDE_WATCH`

They are historical action candidates only, not broker instructions.

## Regression rules
Automated tests must prove that:
1. default `asOf` equals the resolved second-top date;
2. sources inside the broad search window but after the resolved top are excluded;
3. post-top macro observations are excluded;
4. funding is admitted only when its aggregate carries checkpoint cutoff timestamps;
5. changing later support-break/trough/drawdown data leaves snapshot and candidate byte-for-byte unchanged;
6. sparse context cannot silently become a directional candidate;
7. rejected RSI evidence cannot re-enter downstream scoring.

## Learning boundary
Backtest outcome is used only after the candidate exists:

`ACTION_CANDIDATE → BACKTEST_OUTCOME → score/calibration candidate → broader backtest → paper test → validation`

No learned weight or rule may silently change real-money execution.
