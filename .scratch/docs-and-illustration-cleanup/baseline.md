# 기준값 (2026-11-12, 커밋 `6c24616`)

02~04가 화면에 나가는 결과를 바꾸지 않았는지 비교하는 기준이다. 다시 재려면 저장소 루트에서:

```bash
node .scratch/docs-and-illustration-cleanup/baseline.mjs
```

`prototypes/`가 있어야 한다. 해시는 sha256의 앞 16자다.

## 개수

| 항목 | 값 |
|---|---|
| `foods.json` 항목 | 286 (verified 255, foodnuri 21, mof 10) |
| `build/catalog.json` 항목 | 321 |
| 제철 품종 (`foods.generated.ts`) | 255, ID 겹침 없음, `core` 79 |
| 그림 원본 (`prototypes/seasonal-food/foods/<id>/food.mjs`) | 321 |
| 웹 그림 (`apps/web/public/foods/<id>/`) | 296, SVG 592개(`color`·`motion`) |
| 전통 음식 원본 / 웹 | 21 / 19, SVG 19개 |

웹 그림 296 = 제철 품종 그림 255 + 제철 품종이 아닌 그림 41. 원본 321 = 웹 296 + 웹에 없는 25.

## 산출물 해시

| 해시 | 파일 |
|---|---|
| `9d1db725ed68e9ba` | `packages/seasonal/src/data/foods.generated.ts` |
| `65439b95c544e4aa` | `packages/seasonal/src/data/drawn-foods.generated.ts` |
| `cdb86e07a434722d` | `packages/seasonal/src/data/drawn-dishes.generated.ts` |
| `0c886be3c6fdc30f` | `packages/seasonal/src/data/food-bounds.generated.ts` |
| `78e46d36292e6404` | `apps/web/public/foods/PROVENANCE.md` |
| `60f7733f3ef950cd` | `apps/web/public/dishes/PROVENANCE.md` |
| `a563e351bfc688cd` | `apps/web/public/foods/*/*.svg` 592개 묶음 |
| `5e835bac4fb99e82` | `apps/web/public/dishes/*/*.svg` 19개 묶음 |

`PROVENANCE.md`에는 kit과 그림체의 해시가 들어 있어, 04에서 형식을 바꾸면 이 두 값은 달라진다. 그때는 SVG 묶음 해시로 비교한다.

## 품종과 그림이 어긋나는 곳

**품종 ID와 그림 ID를 손으로 맞춘 것** (`build-foods.mjs`의 `DRAWN_AS`): 대하 → `shrimp`, 하귤 → `summer-orange`. `NEW_IDS`와 `CANDIDATE_FOOD_IDS`는 비어 있다.

**제철 보정 품종 7종** (`food-season-corrections.json`): `radish`, `young-radish`, `black-scraper`, `goby`, `sardinella`, `banded-grouper`, `red-rockfish`.

**웹에 있지만 제철 품종이 아닌 그림 41개.** 이유식 화면 등이 쓴다:
`almond` `avocado` `banana` `beef` `black-sesame` `bok-choy` `brown-rice` `butter` `button-mushroom` `cheese` `chicken` `crab-meat` `egg` `egg-yolk` `enoki-mushroom` `grape` `grapefruit` `honey` `jelly` `juice` `kelp` `king-oyster-mushroom` `laver` `mango` `milk` `olive-oil` `orange` `perilla-leaf` `pineapple` `pork` `salmon` `salt` `sashimi` `sesame-oil` `soy-milk` `soybean-sprout` `sugar` `tatsoi` `tofu` `wakame` `white-fish-fillet`

**원본만 있고 웹에 없는 그림 25개.**
- 제철 미검증 품종의 그림 21개: `aloe` `amaranth` `cassia-seed` `dragon-fruit` `freshwater-snail` `goji-berry` `hyang-carp` `jicama` `lemon` `mung-bean-sprout` `neungi-mushroom` `oyster-mushroom` `red-crab` `red-scallop` `reishi-mushroom` `sandfish` `sanghwang-mushroom` `surf-clam` `turmeric` `ulgeum-rhizome` `wasabi`
- 그 밖 4개: `hagyul`(하귤은 `summer-orange`를 쓴다), `black-mottled-skate`(참홍어는 홍어 그림으로 대체), `fleshy-prawn`, `salted-shrimp`

**제철 미검증 31종은 모두 이름으로 대응하는 그림이 있다.** 이 가운데 10종의 그림은 이미 웹에 있다(`bok-choy`, `button-mushroom`, `enoki-mushroom`, `kelp`, `king-oyster-mushroom`, `laver`, `perilla-leaf`, `pineapple`, `wakame`, 그리고 새우류 → `shrimp`).

## 02~04에서 판단할 것

- **새우류와 대하가 같은 그림(`shrimp`)을 가리킨다.** 제철 품종 대하의 ID가 `shrimp`이므로 미검증 품종 새우류는 다른 품종 ID가 필요하다(02).
- **"웹에 나간 그림은 검수 완료, 나머지는 미검수" 규칙을 그대로 쓰면 미검증 품종의 그림 21개가 미검수가 된다.** 그림은 다 그렸지만 제철이 미확인이라 안 나간 것일 수 있다. 03에서 일괄 미검수로 두고 어드민에서 사용자가 판정한다.
- **이유식 그림 목록의 키가 두 가지다.** `FRUIT_GUIDE_ART`는 과일 ID와 주의 식재료 `iconId`, `PAIRING_ART`는 이유식 재료의 한글 이름이다. 값은 그림 ID가 아니라 `/foods/<id>/color.svg` 경로다(03).

## 검증 명령의 현재 상태

루트 `pnpm typecheck` · `pnpm lint` · `pnpm test`는 **실행되지 않는다.** pnpm이 `node_modules`를 지우고 다시 설치하려다 TTY가 없어 중단한다(`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`). 셸의 Node가 v25.9.0이고 저장소는 24.x를 요구한다. 터미널에서 `pnpm install`을 한 번 돌려야 한다.

pnpm 없이 직접 돌린 결과:

| 명령 | 결과 |
|---|---|
| `packages/price-ingest`에서 `tsc --noEmit` | 통과 |
| `packages/price-ingest`에서 `vitest run` | 28개 파일, 361개 통과 |
| `apps/web`에서 `tsc --noEmit` | 통과 |
| 린트, 나머지 패키지 테스트 | 돌리지 못함 |

02를 시작하기 전에 루트 세 명령이 통과하는지 다시 확인하고 이 표를 고친다.
