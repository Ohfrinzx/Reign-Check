# Measurement commit provenance

Git command-line upload was unavailable in this session because it had no credentials. The connected GitHub app uploaded each local commit in order. GitHub assigns different commit metadata and IDs; each uploaded source tree was verified identical to its corresponding tested local tree.

The JSON evidence retains original local source commit IDs. Use this mapping to find the corresponding GitHub commit; measurements were not rerun or relabelled during upload.

| Local measured/source commit | Equivalent GitHub commit |
|---|---|
| `1ef9034a2ee492d5ffb29daff17dc6c8fbcf3f19` | `f33f36076fba5971ba78519b498fbc28be08de0a` |
| `3295c44796f8a6e2948faa083c57fe3eeed9b15f` | `2724d6e109d69cb676a9e784bf926781dc1ad0ab` |
| `f2ac47d341a8257254f75b936d3c75d9add0925c` | `152f5f237c70e7a9e5db1a3bdf003b6d1d978c11` |
| `213129ffb73db14d41521954494382cdfb65f816` | `9c2c83b6c52d15c5fd17a69ae4be63f7ee4dfc8c` |
| `c239fe17c664c3a360487ba3900c6c151925e1b3` | `661d451ae9964f610f149e8b1a27b90e63a3ddef` |
| `b63c2d65596c0a7b2794bea70ac6b541625af4e7` | `47c7f900a0bc86bae5828eda085a0a905bbf90f4` |
| `a0fa5f30b2f34994f1938854e8e7ef3a4096fa17` | `d4bde1953e4e40ef8c05630e44e93640b188e9a8` |
| `02d96a36bd559135e57a4409f663f95135e5fd81` | `0d6876759f147587d33944c101842181d60f1194` |
| `6b02a209065f70c6b11be7146cc8cf79ed0a55b8` | `b11dad5c1440262916166e014fe902a39292cbf7` |
| `bd8c977d07bb2360f9bd98514d4ada6355f44eb8` | `233f97a9e9a3f189c00aab48094b75b8a57b1a38` |
| `61a4f5a2cfde8bbbc97ab22092d7a0d4e175761a` | `6bace11138dfb5847217368307918a1e0c9f2d57` |

The final upload handoff commit changes documentation only. The live default branch must remain at `abe32e8b93ac70c87875feb3e4194f7ce12904ff` pending owner playtesting.
