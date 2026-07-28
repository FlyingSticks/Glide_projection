# checks

The house rule for this board is that no claim ships without a passing check.
This folder is that rule's evidence: every geometric statement badged on the
index was first proven here, in a dependency-free Node script, before it entered
any page.

## Running them

From the repository root:

```
node checks/extract.js     # lift each plate's geometry module out of its HTML
node checks/run-all.js     # run everything, one line per script
```

No dependencies, no install step. Node alone.

`extract.js` matters: the plate tests do not test a copy of the geometry, they
test the exact code the page ships, lifted from its `<script id="geo">` block.
If a sheet is edited and its geometry breaks, the corresponding check fails.

## What is here

**Standalone proofs** — self-contained, no page required:

| script | what it establishes |
|---|---|
| `check_harmonic.js` | four generic lines carry a harmonic range on all three diagonals; the gap pair is unique by the one-side test, not by simplicity |
| `check_simple.js` | two of the three quadrilaterals are simple, not one; simplicity is affine, not projective |
| `check_straddle.js` | the crossed case is exactly the 2–2 split; adjacent straddling sides cannot cross |
| `check_cuts.js` | harmonic conjugates separate: one cut inside segment AB, one outside |
| `check_bowtie.js` | the bowtie's waist is a gap point; in the crossed case the diagonals never cross |
| `check_diagtriangle.js` | the three gap lines are the diagonal triangle; only three distinct cut points exist |
| `check_fano.js` | the diagonals are concurrent in PG(2,2) and nowhere else; the harmonic conjugate stops being a new point in characteristic 2 |
| `check_typeab.js` | Type A carries ratios onto any target; every positive rate concurs at gauge 1/r — the seat is the collector |
| `check_census.js` | counts and incidence survive every drawing mode; cross-ratio survives only the projective ones |
| `check_growth.js` | what "recedes and grows" requires; the lateral's width shrinks to a floor, not to zero |
| `check_xslit_zones.js` | the cross-slit's three depth zones, 5 / 3 / 1 faces, with the slits as boundaries |
| `check_isotropic.js` | a square images square at the harmonic mean of the slit depths, and only there |
| `check_aspect.js` | the far-field shape is z₂/z₁, not a square — square only when the slits coincide |
| `check_midplane.js` | picture plane at the midpoint sends the second square depth to infinity |
| `check_invariance.js` | the invariant is (S₁, S₂ ; square, picture plane) = −1; the far-field aspect is only affine |
| `check_halfformed.js` | one slit settles one coordinate exactly and leaves the other free — a half-formed image is a line |

**Plate tests** — these exercise the code a page actually ships:

`check_gapline_plate.js`, `check_trichotomy_plate.js`, `check_frame.js`,
`check_fano_plate.js`, `check_zones_plate.js`, `check_midplane_plate.js`,
`check_halfformed_plate.js`.

## A note on what these do and do not cover

These scripts are sound for what they are set up to prove and silent about
whether the right thing is being proved. Several framing errors on this board
passed their arithmetic and were caught by eye instead — a wrong claim about
simplicity, a mis-transcribed circle centre, a diagram too small to read. The
checks catch confident-and-wrong assertions. They do not catch well-formed
claims about the wrong thing.
