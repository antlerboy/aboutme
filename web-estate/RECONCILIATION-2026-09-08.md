# Hosted source reconciliation, 8 September 2026

The following `source/` directories contain the complete latest source recovered from the existing Sites repositories, including downloads, images, configuration, and build inputs. They supersede the 5 September ZIPs as the current source reference; older archives remain historical records.

| Project | Current source commit | Hosting still required |
| --- | --- | --- |
| Peter Block community | `8955cfa388fb6ecf23fc8c16e7aec4da0dab835e` | community.antlerboy.com |
| Greebling | `6edcef2958e4cfaad11302a1bcf9839b76be547a` | greebling.com |
| Breaking the Shell | `1fe132eabd3697a9775fdcadc60ae8219d41de7f` | www.breakingtheshell.com; apex attachment pending |
| Quadrant Resourcing | `037cabc506a3c5652fc1dda27fb9a0fb54ed9f58` | quadrantresourcing.com and configured aliases |

Source locations: `peter-block-community/source`, `greebling/source`, `breaking-the-shell/source`, and `quadrant-resourcing/source`.

Large assets are stored losslessly in `asset-parts/` because the connector cannot transfer them in one request. Before building or using these source directories, run `python3 web-estate/restore-source-assets.py` from the repository root. It verifies each reconstructed file's SHA-256 and size, and refuses to overwrite different local content. This includes the original slides and large images. The separate full backup contains normal, unsplit files.

The Aboutme Pages workflow does not publish `web-estate`. Committing these sources therefore does not migrate any custom domain. Keep the existing Site hosts until an explicitly planned hosting and DNS migration has been verified. Restore the appropriate project independently; do not deploy all these packages as the Aboutme website.

The old Greebling `practice-update` directory records a historical patch proposal. Current truth is the recovered source above. Do not reapply an old patch over newer source without comparing it first.
