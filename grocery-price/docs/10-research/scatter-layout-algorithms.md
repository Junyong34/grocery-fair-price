# 05. 제철 그림 흩뿌림 배치 알고리즘

> 확인하지 못한 것은 "확인 못함"으로 적었다. 실험은 저장소 밖(`/tmp/sc/exp/exp.mjs`)에서 돌렸고 저장소 코드는 수정하지 않았다.

## 1. 결론

- 지금 쓰는 best-candidate(k=60)는 **N=15~35에서 쓸 만하지만, 균등성의 상한이 낮고 겹침이 0이 아니다.** 실험에서 N=15일 때 300번 중 평균 0.3쌍이 겹쳤고, 5% 구간에서는 틈 최솟값이 -6px이다.
- **가장 적은 수정으로 가장 크게 좋아지는 것은 후보 수를 N에 비례하게 늘리는 것**이다(Mitchell 원 논문의 m·n 방식). N=35에서 k=60 대비 틈 최솟값 평균이 4.1px에서 9.2px로 늘고, 최대 빈 원은 42.2px에서 41.1px로 줄며, 겹침이 0.18쌍에서 0.01쌍으로 줄었다. 시간은 2.1ms에서 4.2ms다.
- **크기가 다른 원 + 이름표 + 시드 고정 + 개수 N 정확히 일치**를 모두 만족하는 방식 중, 겹침을 가장 확실하게 막는 것은 Poisson-disk(변형)이다. 다만 개수를 직접 못 맞추므로 간격 g를 이분탐색해야 하고(약 1ms), 실험에서 틈 최솟값이 가장 컸다(N=15에서 13.3px, 5% 구간 4.6px).
- **Lloyd 완화는 판 가장자리까지 점을 퍼뜨려 최대 빈 원을 크게 줄이지만(N=15에서 57.7px에서 42px), 원 크기를 모르므로 겹침이 다시 생긴다.** 단독으로는 부적합하고, 뒤에 겹침 해소를 붙여야 한다.
- **저불일치 수열(R2·Halton)은 이 규모에서는 맞지 않는다.** 점 개수가 15~35개로 적고 원이 커서, 수열의 균등성이 최소 간격을 보장하지 않는다.

## 2. 현재 구현 요약

출처: `packages/seasonal/src/layout/scatter.ts`, `packages/ui/src/lib/geometry/relax-circles.ts`, `packages/seasonal/src/layout/merge-saved.ts`.

- `scatterLayout`은 품종마다 `size = base × (0.9~1.1) × foodScale(id)`를 정하고, `findOpenSpot`으로 자리를 찾는다. `base`는 `sqrt(남는 영역 넓이 × 0.45 / n) - label×0.5`이다(`COVERAGE = 0.45`).
- `findOpenSpot`은 후보 60곳(`CANDIDATES`)을 균등 난수로 뽑고, 이미 놓인 원과의 **가장자리 간격**(`hypot - (p.r + r)`)의 최솟값이 가장 큰 후보를 고른다. 후보 영역은 `reserveRight`·`reserveBottom`·라벨 높이를 뺀 상자이다.
- 시드는 `(month × 7919 + n × 104729 + W) % 233280`인 LCG이다.
- `mergeSavedLayout`은 저장된 품종의 자리를 그대로 두고, 새 품종만 `findOpenSpot`으로 넣는다. 새 품종용 시드는 `... + frame.width + 1`이다.
- `relaxCircles`는 겹친 쌍을 반씩 밀어내는 쌍별 반복(기본 8회)이다. 끄는 중인 원은 고정하고, 매 반복 끝에 경계로 clamp한다. 이름표는 고려하지 않는다.
- 코드 주석은 "후보 26개"라고 하지만 실제 상수는 60이다(`findOpenSpot` 위 주석).

## 3. 후보별 조사

### 3.1 best-candidate (Mitchell 1991)

- 요약: 새 점마다 후보를 여럿 뽑아, 기존 점들과의 최근접 거리가 가장 큰 후보를 고른다.
- 원 논문 서술: 첫 점은 임의로 고르고, (n+1)번째 점을 위해 **m·n개**의 균등 난수 후보를 만든다. 후보마다 이미 있는 n개 중 가장 가까운 점까지의 거리를 구해, 그 거리가 가장 큰 후보를 추가한다. "후보 수를 n에 비례해 늘리면 후보 대 점의 비 m이 일정해져, 패턴의 통계(자기상관 등)도 비례해 유지될 것으로 기대한다"고 쓴다. 거리는 주기적 경계(wrap-around)로 잰다(Mitchell, "Spectrally Optimal Sampling for Distribution Ray Tracing", SIGGRAPH 1991, §4 부근. 원문 PDF를 직접 풀어 확인. http://mentallandscape.com/Papers_siggraph91.pdf).
- 현재 코드는 후보 수를 **60으로 고정**한다. 원 논문과 다르다. 고정 후보 수는 나중에 놓는 점일수록 빈 곳이 줄어 상대적으로 약해진다. 한 블로그 구현은 고정 후보 수가 "pretty terrible"했고 후보 수를 점 수에 비례시키면 m=1에서도 훨씬 나았다고 쓴다(2차 자료: https://blog.demofox.org/2017/10/20/generating-blue-noise-sample-points-with-mitchells-best-candidate-algorithm/). 같은 글에는 m이 매우 크면(예: 200) 너무 규칙적으로 보인다는 댓글이 있다. 이 부분은 2차 자료라 참고만 한다.
- 원 논문의 Poisson-disk 보장: 이 방식은 최소 거리를 **보장하지 않는다**. 후보를 더 늘리면 근사만 좋아진다. (이 문장은 논문 원문이 아니라 알고리즘 구조에서 오는 것이다.)
- 비용: 점 n개를 놓는 데 O(n²) (후보 m·n개 × 최근접 검사 n개).

### 3.2 Poisson-disk (Bridson 2007)

- 요약: 모든 점이 서로 최소 r 이상 떨어지도록 하는 점 집합을 O(N)에 만든다.
- 원문 알고리즘(Bridson, "Fast Poisson Disk Sampling in Arbitrary Dimensions", SIGGRAPH 2007 sketch, https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf, 원문 확인): 배경 격자 셀 크기는 r/√n으로 잡아 셀당 점 최대 1개. 첫 점을 균등하게 뽑아 활성 목록에 넣는다. 활성 목록이 빌 때까지, 임의 활성 점 주위의 **r~2r 고리**에서 최대 k개(보통 k=30) 후보를 뽑아, 기존 점과 r 이상 떨어진 첫 후보를 추가한다. k번 모두 실패하면 그 활성 점을 목록에서 뺀다. Step 2는 정확히 2N-1번 실행된다.
- 개수: 원 논문은 **최소 거리 r을 입력**으로 받고 개수는 결과다. 개수를 지정하는 방법은 논문에 없다(확인 못함). 이 프로젝트에서는 간격 g를 이분탐색해 "N 이상"이 나오는 가장 큰 g를 찾고, 앞의 N개를 쓰는 방식으로 실험했다. 고정 g에서의 개수 편차는 §5.3에 있다.
- 크기가 다른 원: 반경이 점마다 다른 변형이 있다. Mitchell·Rand·Ebeida·Bajaj, "Variable Radii Poisson-Disk Sampling", CCCG 2012 (https://2012.cccg.ca/papers/paper15.pdf)는 최대(maximal) Poisson-disk를 억제 반경과 덮개 반경을 분리하고, 반경이 공간에 따라 변하도록 일반화한다(검색 결과 요약으로만 확인. 본문은 읽지 못함). 확인 못함: 이 논문이 "원마다 크기가 다른 원 패킹" 용도를 직접 다루는지. 실험에서는 거리 조건을 `중심 거리 ≥ ri + rj + g`로 바꾸는 단순 변형을 썼다.
- 직사각형·제외 영역: 상자 안에 들어오는 후보만 받아들이면 되므로 쉽다. 달력은 상자에서 빼면 된다.
- 한계: 개수를 직접 못 맞춘다. 크기를 후보 생성 전에 알아야 해서(`sizes[pts.length]`) 품종 순서가 바뀌면 결과가 바뀐다. 크게 먼저 놓는 편이 유리할 수 있다(확인 못함).

### 3.3 Lloyd 완화 / centroidal Voronoi

- 요약: 각 점의 Voronoi 셀의 무게중심으로 점을 옮기는 일을 반복한다. 셀 크기가 고르게 되어 점이 영역 전체에 퍼진다.
- 출처: Lloyd 1982(전통 출처로 알려진 "Least squares quantization in PCM". 이번에 원문 확인 못함). Du, Faber, Gunzburger, "Centroidal Voronoi Tessellations: Applications and Algorithms", SIAM Review 41(4), 1999, pp. 637-676 (https://people.sc.fsu.edu/~mgunzburger/files_papers/gunzburger-cvt-siamreview.pdf). 이 논문 §5.2가 "Voronoi 분할과 무게중심 계산을 번갈아 하는 반복"을 Lloyd 방법으로 소개하고 고정점 반복으로 본다(검색 결과 요약으로 확인). 수렴을 가속하는 방법은 논문에서도 열린 문제로 둔다.
- d3-delaunay (https://d3js.org/d3-delaunay/voronoi, 소스 https://github.com/d3/d3-delaunay/blob/main/src/voronoi.js):
  - `voronoi.update()`는 "점을 제자리에서 바꾼 뒤 Voronoi 도형과 삼각분할을 갱신한다. Lloyd 완화에 유용하다"고 문서에 한 줄 있다. 코드 예제는 문서에 없다.
  - `delaunay.voronoi([xmin, ymin, xmax, ymax])`로 뷰포트를 준다. 문서는 이 값이 "렌더링 메서드에만 영향을 준다"고 쓰지만, 소스에서 `cellPolygon(i)`(132행)가 `_clip(i)`(186행)을 거쳐 **뷰포트로 자른 셀**을 돌려준다. 그래서 직사각형 경계를 따로 처리하지 않아도 무게중심이 상자 안에 머문다. 이번 실험에서도 이 방식으로 돌렸다.
  - `voronoi.contains(i, x, y)`는 뷰포트와 무관하다(문서).
  - `Delaunay.from`은 `new Delaunay(Float64Array)`보다 느리다(문서). 제자리 갱신을 하려면 `delaunay.points`를 직접 고친다.
- 제외 영역: d3-delaunay는 **직사각형 뷰포트 하나**만 지원한다. 지금 판은 달력을 오른쪽이나 아래로 빼서 남는 영역이 직사각형이므로 그대로 쓸 수 있다. 달력이 판 안쪽에 있어 L자형이 되면 뷰포트만으로는 안 된다(확인 못함: 비볼록 영역 지원).
- 크기가 다른 원: 점마다 가중치를 주는 Voronoi(power diagram)는 d3-delaunay 문서에서 찾지 못했다(확인 못함). 그래서 Lloyd는 크기를 무시하고 중심만 퍼뜨린다. 그 결과가 §5의 겹침 증가다.
- 의존성: `d3-delaunay`(+`delaunator`, `robust-predicates`)를 추가해야 한다. 저장소에는 지금 없다(`apps/web/node_modules`에서 확인).
- 비용: N=15에서 Lloyd 3~10회가 약 0.3~0.6ms였다.

### 3.4 jittered grid / stratified sampling

- 요약: 영역을 셀로 나누고 셀마다 하나씩 임의 위치에 둔다. Cook(1986)의 확률적 표본화 계통이다(Cook, "Stochastic sampling in computer graphics", ACM TOG 5(1), 1986. Bridson 논문이 인용한 것만 확인했고 원문은 못 봄).
- Bridson은 "jittered/stratified 표본화는 군집을 줄이되 없애지는 못한다"고 쓴다(Bridson 2007, §1).
- 개수 N에 맞추는 법: 셀 수 ≥ N이면서 셀이 정사각에 가까운 (열, 행)을 고르고, 남는 셀은 임의로 버린다. 이 실험에서는 `|ln(셀 가로/세로)| + 0.35 × (셀 수 - N)`이 최소인 쌍을 골랐다. 상자 412×585에서 N=15는 3×5로 딱 맞는다.
- 제외 영역: 남는 영역이 직사각형이면 그 직사각형만 나누면 된다. L자형이면 직사각형 둘로 나눠 넓이 비례로 셀을 배분하는 식이 되는데, 이번에 구현하거나 출처로 확인하지는 않았다.
- 한계: 이웃 셀의 점끼리 가까워질 수 있어 최소 간격이 보장되지 않는다. 크기가 다른 원을 셀에 넣을 때 큰 원은 셀 밖으로 나온다. 셀 안 지터 범위를 좁히면 격자처럼 보인다.

### 3.5 저불일치 수열(R2, Halton, Sobol)

- R2: Martin Roberts, "The Unreasonable Effectiveness of Quasirandom Sequences", 2018 (https://extremelearning.com.au/unreasonable-effectiveness-of-quasirandom-sequences/). 직접 접속은 이 환경에서 TLS 오류로 못 읽었고, 검색 결과 요약으로 확인했다. 요약에 따르면 2차원에서 `t_n = {n·α}`, `α = (1/g, 1/g²)`, `g ≈ 1.32472`(플라스틱 상수, `x³ = x + 1`의 실근)이다. 같은 요약은 R2가 덧셈 점화식으로 계산 가능하고(`z[i+1] = (z[i] + α) mod 1`), n=150에서 Halton(2,3)·Kronecker·Niederreiter·Sobol보다 고르게 퍼진다고 전한다. 본문 인용은 확인 못함.
- Halton·Sobol 원문은 이번에 읽지 않았다(확인 못함).
- 결정성: 수열이라 난수 없이도 같은 결과가 나온다(시작 오프셋만 시드로 정하면 된다).
- 제외 영역 거부: 판 전체를 수열로 채우고 달력 자리에 떨어진 점을 버리면 남는 영역에서는 수열이 아니라 일부 부분열이 되어 균등성이 깨진다. §5에서 "프레임 전체 + 달력 거부"가 "상자에 직접 매핑"보다 틈 최솟값이 나빴다(N=15에서 평균 -15.8 대 -7.2). 직사각형이면 수열을 상자에 직접 매핑하는 편이 낫다.
- 한계: 저불일치는 개수가 많을 때 구간 채움이 고르다는 성질이고, 점 사이 최소 거리나 원 크기를 고려하지 않는다. N=15, 원 지름 80~110에서는 R2도 평균 2쌍 정도 겹쳤다.

### 3.6 원 패킹 / 힘 기반 완화

- d3-force `forceCollide` (https://d3js.org/d3-force/collide, 소스 https://github.com/d3/d3-force/blob/main/src/collide.js): 노드를 점이 아니라 반지름 `radius(d)`를 가진 원으로 보고, 두 노드 사이 거리가 `radius(a) + radius(b)` 이상이 되게 민다. 기본은 "부드러운(soft)" 제약이라 `strength`(기본 1)와 `iterations`(기본 1)로 조절하고, 반복을 늘리면 단단해지고 비용이 는다(문서). 소스는 쿼드트리로 가까운 쌍만 검사하고, 밀어내는 비율을 반지름 제곱에 비례해 나눈다(큰 원이 덜 움직임).
- 크기가 다른 원: 위 비율로 자연스럽게 처리한다.
- 경계: `forceCollide` 자체는 경계를 모른다. `forceX/forceY`로 중심 쪽으로 당기거나, 매 틱 후 상자 안으로 clamp해야 한다. 이번 실험은 약한 중심 인력(0.02)과 `forceManyBody(-30)`, 매 틱 clamp를 썼다.
- 결정성: `simulation.randomSource` 기본값이 **고정 시드 LCG**이고, 초기 위치가 NaN이면 phyllotaxis 배열로 정해 "결정적이고 균등한 분포"를 보장한다(https://d3js.org/d3-force/simulation). 정적 배치는 `.stop()` 후 `simulation.tick(300)`을 부르라고 문서가 권한다. 기본 `alphaDecay`가 약 300틱에 해당한다(문서, 소스 `simulation.js`의 `alphaDecay = 1 - pow(alphaMin, 1/300)`).
- 비용: 이번 실험에서 N=15에 약 10ms, N=35에 약 31ms로 가장 느렸다(Node, 300틱). 서버 렌더에서 매 요청마다 돌리기에는 무겁다(결과를 캐시하면 다른 이야기).
- 한계: 힘을 중심으로 당기면 원이 가운데 뭉쳐 가장자리가 빈다. 실험에서 최대 빈 원이 N=15에 72px로 가장 컸다. 중심 인력을 약하게 하거나 없애면 원이 상자 벽에 붙는다.
- 현재 `relaxCircles`와의 차이: 현재 코드는 쌍별 반복(O(n²))이고 이웃 검색 가속이 없다. n≤35에서는 충분하다.

### 3.7 라벨 배치와 직사각형 충돌

- 점 특징 라벨 배치(point-feature label placement)는 NP-hard이고 기존 알고리즘은 지수 시간이거나 불완전하다. Christensen, Marks, Shieber(1995)는 이산 경사하강과 시뮬레이티드 어닐링을 제안해 비교했다(ACM TOG 14(3), 203-232, https://dl.acm.org/doi/10.1145/212332.212334. 초록 수준만 확인하고 본문은 못 읽음).
- 이 프로젝트는 라벨 위치를 고르는 게 아니라 **그림 아래 고정 위치에 라벨이 붙는** 경우라서 문제가 훨씬 단순하다. 그림과 라벨을 합친 직사각형(또는 둥근 직사각형)으로 충돌을 재면 된다.
- 원과 축 정렬 직사각형의 거리: 원 중심에서 직사각형까지의 최단 거리(`dx = max(left - x, 0, x - right)`, `dy` 동일)를 구해 `hypot(dx, dy) - r`로 틈을 잰다. 이것은 일반 기하학이며 이번에 별도 1차 자료를 찾지 않았다(확인 못함: 출처).
- 이름표 폭은 글자 수에 따라 다르다. 현재 코드는 라벨을 높이(`labelHeight`)만 고려해 후보 영역 아래를 비워 둘 뿐, 라벨끼리의 겹침은 재지 않는다. 이름이 긴 품종이 겹치는 문제가 있는지는 이번에 조사하지 않았다.

## 4. 한눈에 비교

N=15~35, 판 752×600에서 오른쪽 340 제외. "개수 N"은 결과 개수를 정확히 N으로 맞출 수 있는지이다. 비용은 §5의 배치 1회 평균(Node 25, Apple 기기).

| 방식 | 제외 영역(직사각형) | 크기가 다른 원 | 결정성 | 개수 N 정확히 | 비용(N=15 / 35) | 구현 난이도(외부 의존성 없이) | 대표 한계 |
|---|---|---|---|---|---|---|---|
| best-candidate k=60 (현재) | 후보 영역만 제한하면 됨 | 간격으로 직접 반영 | LCG 시드 | 가능 | 0.4 / 2.1 ms | 이미 구현 | 최소 간격 보장 없음, 겹침 가끔 |
| best-candidate m·n+1 | 동일 | 동일 | 동일 | 가능 | 0.4 / 4.2 ms | 상수 한 줄 | 후보 수 크면 규칙적으로 보일 수 있음(2차 자료) |
| 지터 격자 | 직사각형이면 쉬움 | 큰 원은 셀 밖으로 나옴 | 가능 | 가능(셀 버림) | 0.01 ms | 쉬움 | 이웃 점이 가까워질 수 있음, 겹침 많음 |
| Poisson-disk(Bridson 변형) | 후보 거부로 쉬움 | `ri + rj + g` 변형 필요 | 가능 | 직접 못 맞춤(g 탐색) | 1.0 / 5.1 ms | 보통 | 개수가 입력이 아니라 결과 |
| Lloyd(d3-delaunay) | 직사각형 뷰포트 하나 | 크기 무시(가중 Voronoi는 확인 못함) | 초기 점이 결정적이면 결정적 | 가능(점 수 불변) | +0.3~0.6 ms / +2 ms | 쉬움, 의존성 3개 | 겹침 증가, L자형 불가 |
| R2 / Halton | 상자 직접 매핑이면 쉬움, 거부는 손실 | 무시 | 완전 결정적 | 가능 | 0.01 ms | 매우 쉬움 | 최소 간격 보장 없음 |
| 힘 기반(d3-force) | clamp 필요 | 반지름으로 처리 | 고정 시드 LCG | 가능 | 10 / 31 ms | 의존성 2개 | 느림, 중심으로 뭉침 |
| relaxCircles(현재, 후처리) | 기존 clamp | 반지름으로 처리 | 가능 | 가능 | +0.1~0.3 ms | 이미 구현 | 겹침만 풀고 균등하게 만들지는 않음 |

## 5. 실험

### 5.1 측정 방법

- 스크립트: `/tmp/sc/exp/exp.mjs` (Node 25, d3-delaunay, d3-force 설치). 저장소 밖이며 커밋하지 않는다.
- 조건: 상자 = 달력을 뺀 영역 `412 × 585`(= `(752-340) × (600-15)`, 라벨 높이 15 제외, 원 전체가 이 안에 들어오도록 중심을 제한). 원 크기는 `base × (0.9~1.1)`에 20%는 ×1.25(품종별 배율을 흉내 낸 것). `base = sqrt(412×600×0.45/N) - 7.5`. N=15에서 지름 약 71~108px, N=35에서 약 43~66px(요청의 80~110보다 N=15에서는 약간 작고 큰 원은 약 108px). 시드를 바꿔 N=15는 300번, N=35는 200번 반복해 평균을 냈다. 시드 규칙은 현재 코드와 같은 LCG(best-candidate 계열), 그 외는 mulberry32.
- 지표(원 가장자리 사이 틈 = 중심 거리 - 두 반지름):
  - **최근접 틈 평균**: 원마다 가장 가까운 이웃과의 틈의 평균. 클수록 성기게 분포한다.
  - **최근접 틈 최솟값**: 한 배치에서 가장 가까운 쌍의 틈(음수면 겹침). 위 표에는 반복 평균과 하위 5% 값(p5)을 같이 적었다.
  - **틈 표준편차**: 한 배치 안에서 원마다 최근접 틈의 표준편차. 작을수록 고르다.
  - **겹친 쌍**: 틈이 0보다 작은 쌍의 평균 개수.
  - **최대 빈 원 반지름(LEC)**: 상자 안에서 원(가장자리)과 상자 벽으로부터 가장 멀리 떨어진 점까지의 거리. 3px 격자로 근사했다. 작을수록 큰 빈 곳이 없다.
  - **ms/배치**: 배치 한 번의 계산 시간(Node 25, 워밍업 포함, 지표 계산 제외).
- 주의: LEC에는 상자 벽까지의 거리도 포함한다. 원이 가운데 몰리면 벽 근처가 빈 곳이 된다. Lloyd는 점을 벽 쪽으로 퍼뜨려 이 지표를 크게 줄인다.
- 한계: 라벨 직사각형 충돌은 재지 않았다(상자 높이에서 라벨 높이만 뺐다). 저불일치 수열은 상자에 직접 매핑한 경우를 "R2"로 쓴다. Lloyd는 중심을 상자 안쪽(평균 반지름만큼 안쪽)에서 계산하고 마지막에 원을 상자 안으로 clamp한다.

### 5.2 결과: N=15 (300회 평균)

| 방법 | 최근접 틈 평균 | 최솟값(평균) | 최솟값 p5 | 틈 표준편차 | 겹친 쌍 | LEC 평균 | LEC p95 | ms |
|---|---|---|---|---|---|---|---|---|
| best-candidate k=60 (현재) | 24.6 | 5.3 | -6.1 | 15.4 | 0.30 | 57.7 | 66.7 | 0.38 |
| best-candidate k=10 | 13.1 | -11.5 | -27.6 | 18.5 | 2.36 | 63.4 | 76.8 | 0.07 |
| best-candidate k=300 | 32.0 | 14.2 | 3.0 | 14.7 | 0.03 | 59.1 | 66.6 | 1.47 |
| best-candidate m·n+1 (m=10) | 25.9 | 8.1 | -4.6 | 14.0 | 0.22 | 56.1 | 66.1 | 0.42 |
| 무작위(k=1) | -23.7 | -64.2 | -83.6 | 32.2 | 11.21 | 89.6 | 112.8 | 0.01 |
| 지터 격자 | 18.2 | -11.7 | -28.5 | 20.4 | 1.61 | 63.2 | 75.3 | 0.01 |
| Poisson-disk(Bridson) + g 이분탐색 | 21.7 | 13.3 | 4.6 | 9.0 | 0.01 | 56.7 | 69.0 | 0.97 |
| R2 (상자에 직접 매핑) | 7.6 | -7.2 | -18.3 | 9.9 | 2.14 | 66.4 | 76.1 | 0.00 |
| R2 (프레임 전체 + 달력 거부) | 9.3 | -15.8 | -36.8 | 17.2 | 2.27 | 66.7 | 75.6 | 0.00 |
| Halton(2,3) | -7.0 | -41.5 | -67.2 | 27.1 | 6.47 | 67.4 | 77.7 | 0.00 |
| best-candidate + Lloyd 3회 | 12.6 | -3.5 | -14.6 | 10.4 | 1.05 | 45.3 | 52.0 | 0.59 |
| best-candidate + Lloyd 10회 | 14.4 | 0.5 | -11.0 | 9.1 | 0.66 | 41.9 | 46.5 | 0.33 |
| 지터 격자 + Lloyd 3회 | 16.0 | 3.5 | -7.5 | 7.6 | 0.31 | 40.1 | 42.0 | 0.05 |
| best-candidate + relaxCircles(gap 0, 8회) | 24.8 | 6.3 | -0.0 | 15.2 | 0.14 | 57.7 | 66.7 | 0.24 |
| R2 + relaxCircles(gap 0, 8회) | 8.9 | 0.5 | -0.0 | 8.0 | 1.16 | 66.2 | 76.1 | 0.01 |
| 무작위 + d3-force(collide+charge, 300틱) | 12.0 | 12.0 | 12.0 | 0.0 | 0.00 | 72.4 | 83.0 | 10.64 |

### 5.3 결과: N=35 (200회 평균)

| 방법 | 최근접 틈 평균 | 최솟값(평균) | 최솟값 p5 | 틈 표준편차 | 겹친 쌍 | LEC 평균 | LEC p95 | ms |
|---|---|---|---|---|---|---|---|---|
| best-candidate k=60 (현재) | 18.8 | 4.1 | -2.8 | 9.6 | 0.18 | 42.2 | 48.0 | 2.05 |
| best-candidate k=300 | 22.3 | 9.3 | 2.1 | 8.9 | 0.02 | 41.2 | 45.2 | 12.30 |
| best-candidate m·n+1 (m=10) | 21.8 | 9.2 | 3.7 | 8.3 | 0.01 | 41.1 | 45.0 | 4.17 |
| 지터 격자 | 14.5 | -8.1 | -18.3 | 12.9 | 2.69 | 45.6 | 51.2 | 0.01 |
| Poisson-disk(Bridson) + g 이분탐색 | 18.5 | 12.8 | 9.6 | 6.0 | 0.00 | 41.9 | 48.2 | 5.07 |
| R2 (상자에 직접 매핑) | 8.3 | -6.4 | -11.5 | 9.5 | 3.04 | 44.8 | 51.1 | 0.01 |
| best-candidate + Lloyd 10회 | 17.9 | 6.1 | -1.1 | 6.0 | 0.09 | 31.5 | 34.9 | 2.26 |
| 지터 격자 + Lloyd 3회 | 18.6 | 7.6 | 1.3 | 5.5 | 0.03 | 30.5 | 33.2 | 0.21 |
| best-candidate + relaxCircles(gap 0, 8회) | 18.8 | 4.4 | -0.0 | 9.6 | 0.10 | 42.2 | 48.0 | 1.44 |
| 무작위 + d3-force | 13.0 | 12.0 | 12.0 | 2.2 | 0.00 | 56.9 | 65.0 | 30.66 |

(나머지 행은 전체 출력 `/tmp/sc/exp/out35.md`에 있다.)

### 5.4 Poisson-disk 개수 편차

고정 간격 g(원 가장자리 사이 최소 틈, px)에서 Bridson 변형이 낸 개수(N=15용 크기, 200회).

| g | 평균 | 최소 | 최대 |
|---|---|---|---|
| 0 | 17.3 | 12 | 20 |
| 10 | 14.9 | 11 | 18 |
| 20 | 12.5 | 9 | 16 |
| 30 | 10.7 | 6 | 14 |

같은 g에서도 개수가 ±3~4개 흔들린다. 그래서 N을 맞추려면 g를 이분탐색하고, 넘치면 뒤쪽을 잘라야 한다(잘라도 최소 틈 조건은 유지된다).

### 5.5 읽는 법과 주의

- **현재 방식의 최소 틈 평균은 +5px이지만 5% 구간에서는 -6px이다.** 겹침이 가끔 생긴다. N=35에서는 +4.1px, -2.8px이다.
- **후보 수를 늘리면 최소 틈은 확실히 좋아진다**(k=10 → 60 → 300에서 -11.5 → 5.3 → 14.2). 그러나 최대 빈 원은 거의 달라지지 않는다(63.4 → 57.7 → 59.1). 즉 best-candidate는 이웃과 가깝지 않게 하는 데는 효과적이지만, 판 가장자리와 모퉁이의 빈 곳을 메우는 힘은 약하다.
- **Lloyd는 최대 빈 원을 가장 크게 줄인다**(N=15에서 57.7 → 41.9, N=35에서 42.2 → 31.5). 같은 이유로 최근접 틈 평균은 작아지고 겹침이 늘어난다. 크기를 반영하지 못해서다. Lloyd 뒤에 `relaxCircles`로 겹침을 푸는 조합은 이번에 재지 못했다(확인 못함. 이어서 해 볼 만하다).
- **지터 격자 + Lloyd 3회**는 N=35에서 LEC 30.5, 겹침 0.03쌍으로 최고였다. N=15에서는 겹침 0.31쌍이다. 시간도 0.2ms로 가장 빨랐다. 단 이웃 틈이 아니라 "판 전체가 고르게 채워짐"을 최적화한 결과이므로, 그림이 크고 개수가 적으면 원이 벽에 붙는 모양이 될 수 있다(시각 확인은 못 함).
- d3-force의 틈 표준편차 0과 최솟값 12.0은 `forceCollide(r + 6)`이 만든 값이다(원마다 6px씩 여유). 틈이 전부 12px로 같다는 것은 원이 빽빽하게 가운데 뭉쳤다는 뜻이다. LEC가 가장 큰 것도 같은 이유다. 이 숫자만 보고 "균일하다"고 읽으면 안 된다.
- 실험의 한계: 표본 수가 N=15 300회, N=35 200회이고, 크기 분포는 임의로 정했다. 실제 품종 크기와 시드로는 다를 수 있다. Node 25에서 잰 시간이며 서버(Next.js 런타임, 콜드 스타트) 시간과는 다르다. 라벨 직사각형 충돌은 재지 않았다. 사람이 보고 좋다고 느끼는 정도는 재지 않았다.

## 6. 이 프로젝트에 권장하는 방식

**권장: best-candidate를 유지하되, (1) 후보 수를 `m·n + 1`(m≈10)로 바꾸고, (2) 마지막에 `relaxCircles`로 남은 겹침을 풀고, (3) 가장자리와 모퉁이 빈 곳이 거슬리면 "지터 격자 → Lloyd 2~3회 → relaxCircles" 경로를 시도한다.**

이유:

1. `m·n+1`은 Mitchell 원 논문이 정한 방식이고(§3.1), 이번 실험에서 N=35에서 틈 최솟값이 4.1에서 9.2px로 개선되고 겹침이 0.18에서 0.01쌍으로 줄었다. N=15에서는 5.3에서 8.1px, 겹침 0.30에서 0.22쌍으로 개선 폭이 작다. 변경은 한 줄이고 외부 의존성이 없다.
2. 겹침이 남는 5% 정도의 경우는 `relaxCircles(gap 0)` 후처리로 처리된다. 실험에서 best-candidate + relaxCircles는 p5가 0.0이 되고 평균 겹침이 0.14쌍(N=15)·0.10쌍(N=35)으로 줄었다. 후처리 시간은 약 0.1~0.3ms다. 완화는 겹친 원만 움직이므로 균등성을 해치지 않았다(LEC 불변).
3. 큰 빈 곳이 문제라면 후보 수보다 Lloyd 계열이 효과적이다(§5.5). 다만 d3-delaunay 의존성이 늘고, 원 크기를 반영하지 못해 겹침이 늘어서 반드시 `relaxCircles`와 함께 써야 한다. 이번 실험에서 `지터 격자 + Lloyd 3회`의 결과가 가장 좋은 쪽에 속했지만 사람이 본 판단은 하지 못했으므로, 의존성을 늘리기 전에 같은 시드 몇 개로 화면에서 먼저 비교하기를 권한다.
4. Poisson-disk는 겹침 보장 면에서 가장 강하지만(N=15, 틈 최솟값 평균 13.3, 겹침 0.01쌍) 개수가 결과라서 이분탐색이 필요하고, 크기 변형은 직접 만들어야 한다. 얻는 것(겹침 0.3쌍 → 0.01쌍)에 비해 구현 부담이 커서 1순위는 아니다.
5. R2/Halton, d3-force는 이 용도에 맞지 않는다(§3.5, §3.6).

### 바꿀 때 건드릴 파일

- `packages/seasonal/src/layout/scatter.ts`:
  - `findOpenSpot`의 `CANDIDATES` 상수를 `placed.length`에 비례하는 값으로 바꾼다(`placed.length * 10 + 1`처럼). `scatterLayout`과 `mergeSavedLayout`이 같은 함수를 쓰므로 두 경로가 함께 바뀐다. 호출부 시그니처는 그대로 둘 수 있다.
  - `findOpenSpot` 위 주석의 "후보 26개"를 고친다(실제는 60).
  - `scatterLayout` 끝에서 `relaxCircles`를 한 번 부를지 정한다. 이 파일은 `packages/seasonal`(도메인, "React·DOM 없음")에 있고 `relaxCircles`는 `packages/ui`에 있다. 레이어 규칙(아래 계층만 import)상 `seasonal`이 `ui`를 부를 수 없다. 따라서 (a) 완화 함수를 `packages/seasonal` 쪽으로 옮기거나 복제하거나, (b) 완화를 `apps/web`의 feature에서 호출해야 한다. (a)는 `relax-circles.ts`가 DOM 무관한 순수 함수라 가능하지만 AGENTS.md의 레이어 표를 따로 정해야 한다(확인 못함: 팀의 선호).
- `packages/seasonal/src/layout/merge-saved.ts`: 새 품종 삽입 경로가 `findOpenSpot`을 재사용하므로 후보 수 변경은 자동 적용된다. 새 품종이 한 번에 여럿 들어올 때 후보 수가 `placed.length`(저장된 것 포함)에 비례하는지 확인한다. 완화를 추가한다면 저장된 품종은 pinned로 고정하고 새 품종만 움직이는 방식이 필요하다(`relaxCircles`의 `pinned`는 id 하나만 받는다. 여러 개를 고정하려면 확장해야 함).
- Lloyd를 쓴다면 `scatterLayout`의 호출 구조를 "초기 배치 → Lloyd → 완화"로 바꾸고, `apps/web`이 아니라 `packages/seasonal`에 `d3-delaunay` 의존성을 추가하게 된다.
- 테스트: 기존 배치 테스트가 있는지 이번에 확인하지 않았다(확인 못함). 시드 결정성, 겹침 개수, 영역 밖 이탈 여부를 검증하는 테스트를 같이 바꾼다.

### 위험

- **시드 변경으로 모든 달의 기본 배치가 바뀐다.** 후보 수를 바꾸면 같은 시드에서도 `rand()` 소비 개수가 달라져 배치 전체가 달라진다. 사용자가 옮긴 적 없는 달이면 눈에 띄는 변화일 뿐이지만, 그림 위치를 기억하는 사용자에게는 위화감이 있을 수 있다.
- **저장된 사용자 배치와의 호환.** `mergeSavedLayout`은 저장된 품종 자리를 그대로 지킨다. 후보 수가 바뀌어도 저장된 자리는 유지되므로 호환 문제는 없다. 다만 시드 배치의 크기(`size`)가 바뀌면(§2의 `base` 변경을 같이 하는 경우) 저장된 자리 주변이 겹칠 수 있다. 현재도 코드 주석이 "크기가 바뀌어 생긴 작은 겹침은 화면이 겹침 해소로 푼다"고 한다.
- **새 품종 삽입 경로의 시드.** `mergeSavedLayout`은 별도 시드(`+ 1`)를 쓰므로 후보 수만 바꾸면 이 경로는 같은 입력에서 이전과 다른 위치를 낸다. 저장된 배치에 새 품종이 이미 한 번 배치되어 저장되었다면 그 자리는 유지되지만, 아직 저장되지 않은 새 품종은 위치가 바뀐다.
- **서버 계산 시간.** `m·n+1`은 N=35에서 약 4ms다(현재 2ms). 달마다 한 번이면 수 ms 목표 안이다. Lloyd를 더하면 N=35에서 +2ms다.
- **라벨 겹침은 해결되지 않는다.** 이번 조사는 그림 원끼리의 틈만 다뤘다. 이름표 직사각형끼리·이름표와 다른 그림의 겹침을 줄이려면 충돌 기하를 원에서 "원 + 라벨 직사각형"으로 바꿔야 하고(§3.7), 이것은 별도 작업이다.

## 7. 출처 목록

- Mitchell, D. P. (1991). Spectrally Optimal Sampling for Distribution Ray Tracing. SIGGRAPH '91, Computer Graphics 25(4), 157-164. http://mentallandscape.com/Papers_siggraph91.pdf (원문 확인. PDF 내부 텍스트 직접 추출)
- Bridson, R. (2007). Fast Poisson Disk Sampling in Arbitrary Dimensions. SIGGRAPH 2007 sketch. https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf (원문 확인)
- Mitchell, Rand, Ebeida, Bajaj (2012). Variable Radii Poisson-Disk Sampling. CCCG 2012. https://2012.cccg.ca/papers/paper15.pdf (검색 요약만)
- Du, Faber, Gunzburger (1999). Centroidal Voronoi Tessellations: Applications and Algorithms. SIAM Review 41(4), 637-676. https://people.sc.fsu.edu/~mgunzburger/files_papers/gunzburger-cvt-siamreview.pdf (검색 요약만)
- Lloyd, S. P. (1982). Least squares quantization in PCM. IEEE Trans. Inf. Theory 28(2). (원문 확인 못함. Du 등이 이 방법을 Lloyd 방법으로 부른다는 요약만)
- d3-delaunay 문서와 소스: https://d3js.org/d3-delaunay/voronoi, https://d3js.org/d3-delaunay/delaunay, https://github.com/d3/d3-delaunay/blob/main/src/voronoi.js
- d3-force 문서와 소스: https://d3js.org/d3-force/collide, https://d3js.org/d3-force/simulation, https://github.com/d3/d3-force/blob/main/src/collide.js, `simulation.js`
- Roberts, M. (2018). The Unreasonable Effectiveness of Quasirandom Sequences. https://extremelearning.com.au/unreasonable-effectiveness-of-quasirandom-sequences/ (직접 접속 실패. 검색 요약만)
- Christensen, Marks, Shieber (1995). An empirical study of algorithms for point-feature label placement. ACM TOG 14(3), 203-232. https://dl.acm.org/doi/10.1145/212332.212334 (초록 수준)
- Cook, R. L. (1986). Stochastic sampling in computer graphics. ACM TOG 5(1). (Bridson 논문의 인용으로만 확인)
- 2차 자료(참고만): https://blog.demofox.org/2017/10/20/generating-blue-noise-sample-points-with-mitchells-best-candidate-algorithm/
- 이 저장소: `packages/seasonal/src/layout/scatter.ts`, `packages/seasonal/src/layout/merge-saved.ts`, `packages/ui/src/lib/geometry/relax-circles.ts`
