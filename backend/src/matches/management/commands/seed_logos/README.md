# Demo club crests

Real club crests used by `seed_demo` so the demo match-center shows recognisable
logos. They are attached to the seeded `Team.logo` records (see
`seed_demo._set_logo`).

## Provenance

Downloaded from Wikipedia (English) via the `pageimages` API at 960px, rendered
to PNG from the source SVGs:

| File      | Club               | Wikipedia article  |
| --------- | ------------------ | ------------------ |
| `rma.png` | Real Madrid CF     | Real Madrid CF     |
| `bar.png` | FC Barcelona       | FC Barcelona       |
| `atm.png` | Atlético de Madrid | Atlético Madrid    |
| `ath.png` | Athletic Club      | Athletic Bilbao    |

## Licensing

These crests are **non-free, trademarked** club emblems, included here only as
illustrative demo data. They are **not** covered by the project's MIT licence. A
real white-label deployment should replace them (or upload its own via the admin
**Teams → Club logo** screen).

## Refreshing

```bash
python3 - <<'PY'
import json, subprocess, urllib.parse
clubs = {"rma":"Real Madrid CF","bar":"FC Barcelona","atm":"Atlético Madrid","ath":"Athletic Bilbao"}
ua, api = "OpenMatchroom-seed/1.0 (demo)", "https://en.wikipedia.org/w/api.php"
for key, title in clubs.items():
    q = urllib.parse.urlencode({"action":"query","format":"json","prop":"pageimages",
        "piprop":"thumbnail","pithumbsize":"512","pilicense":"any","titles":title,"redirects":"1"})
    page = next(iter(json.loads(subprocess.run(["curl","-sL","-A",ua,f"{api}?{q}"],
        capture_output=True,text=True).stdout)["query"]["pages"].values()))
    subprocess.run(["curl","-sL","-A",ua,"-o",f"{key}.png",page["thumbnail"]["source"]])
PY
```
