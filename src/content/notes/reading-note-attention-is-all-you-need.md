---
title: "[Reading Note] Attention Is All You Need"
slug: "reading-note-attention-is-all-you-need"
generated: true
status: "completed"
domain:
  - "Transformer"
  - "Self-Attention"
  - "Sequence Transduction"
type: "paper-review"
researchFields:
  - "ML"
featured: true
methods:
  - "Scaled Dot-Product Attention"
  - "Multi-Head Attention"
  - "Encoder–Decoder Architecture"
date: "2026-07-28"
paperUrl: "https://proceedings.neurips.cc/paper_files/paper/2017/file/3f5ee243547dee91fbd053c1c4a845aa-Paper.pdf"
otherSources:
  - "https://www.youtube.com/watch?v=_Z3rXeJahMs"
notion: "https://app.notion.com/p/Reading-Note-Attention-Is-All-You-Need-3ab14b84a0f280fe9dd7e272ad4c8470"
---

<!-- This file is generated from Notion. Do not edit directly. -->

| 속성              | 역할          | 권장 개수    |
| --------------- | ----------- | -------- |
| Research Theme  | 최상위 연구 축    | 노트당 1개   |
| Domain          | 구체적인 연구 분야  | 노트당 1~3개 |
| Methods         | 사용하거나 다룬 기술 | 제한 없음    |
| Type            | 문서 형식       | 1개       |
| Status          | 작성 상태       | 1개       |
| Related Project | 연결된 프로젝트    | 0~2개     |


## Paper Information

> **Title:** Attention Is All You Need
>
> **Authors:** Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser, Illia Polosukhin
>
>
> **Affiliation:** Google Brain, Google Research, University of Toronto
>
>
> **arXiv ID:** arXiv:1706.03762 `[cs.CL]`
>
>
> **Topic:** Transformer, Self-Attention, Scaled Dot-Product Attention, Multi-Head Attention, Encoder–Decoder Architecture, Positional Encoding, Sequence-to-Sequence Learning, Neural Machine Translation
>
>
> **Venue:** Advances in Neural Information Processing Systems 30, 31st Conference on Neural Information Processing Systems, NIPS 2017
>
>
> **Pages:** 5998–6008
>
>
> **Year:** 2017
>
>

## 1. One-line Summary


## 2. Problem

> The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder.

이 논문이 나올때쯤, sequence transduction model에서 지배적이었던 구조는Encoder-Decoder의 복잡한 RNN 방식이나 CNN방식 이었음

- Sequence Transduction이란 한 시퀀스를 다른 시퀀스로 변환하는 작업
    - 영어 문장 → 독일어 문장
    - 음성 신호 → 텍스트
    - 긴 문장 → 요약문
> The best performing models also connect the encoder and decoder through an attention mechanism.

성능이 가장 좋은 모델도 encoder-decoder 연결에 attention 기법을 활용한 경우.


이전 발전 흐름은 크게 **LSTM (Long short-term memory)**와 **gated recurrent neural networks**였음


### LSTM과 Gated Recurrent Neural Networks

> **LSTM과 GRU 같은 게이트 기반 RNN이 당시 시퀀스 모델링의 대표 방법이었다**

1. 기본 RNN의 문제


기본 RNN은 현재 입력 $x_t$와 이전 시점의 기억 $h_{t-1}$로 새로운 기억 $h_t$를 만듭니다.


$h_t=\tanh(W_xx_t+W_hh_{t-1}+b)$


하지만 기본 RNN에는 다음 문제가 있습니다.

- **이전 정보를 얼마나 남길지 결정**하는 장치가 없음
- 새 정보가 들어올 때 기존 기억이 **쉽게 덮어써짐**
- 긴 시퀀스에서는 **앞부분 정보가 소실**되기 쉬움
- **역전파 과정에서 기울기 소실**이 발생하기 쉬움
> LSTM과 GRU는 이 문제를 완화하기 위해 **gate를 도입한 RNN**입니다.
>
> Gate는 0과 1 사이의 값을 출력하여 정보의 통과량을 조절합니다.
>
>
> $\sigma(\cdot)\in[0,1]$
>
> - 0에 가까움: 정보를 거의 통과시키지 않음
> - 1에 가까움: 정보를 대부분 통과시킴
>

---


2. LSTM


![Notion image](/notion-assets/reading-note-attention-is-all-you-need/3b114b84a0f28009ba37fb8127fd03f5.png)


Source: IBM Official documentation, [https://www.ibm.com/think/topics/lstm](https://www.ibm.com/think/topics/lstm)


LSTM은 **Long Short-Term Memory**의 약자. 기본 RNN보다 장기간 정보를 유지할 수 있도록, 일반 hidden state와 별도로 **cell state** $c_t$를 둡니다.


LSTM에는 세 가지 주요 gate가 있습니다.

> **1. Forget gate :** 이전 cell state에서 **무엇을 버릴지 결정**합니다.
>
> $f_t=\sigma(W_f[x_t,h_{t-1}]+b_f)$
>
>
> 예를 들어 장면이 완전히 바뀌었다면 이전 장면의 정보를 많이 삭제할 수 있습니다.
>
>
> **2. Input gate :** 현재 입력으로부터 **어떤 새로운 정보를 저장할지 결정**합니다.
>
> $i_t=\sigma(W_i[x_t,h_{t-1}]+b_i)$
>
>
> 새롭게 저장할 후보 정보도 계산합니다.
>
>
> $\tilde{c}t=\tanh(W_c[x_t,h{t-1}]+b_c)$
>
>
> 이후 이전 기억과 새로운 정보를 결합합니다.
>
>
> $c_t=f_t\odot c_{t-1}+i_t\odot\tilde{c}_t$
>
>
> **3. Output gate :** 현재 cell state 중 **어떤 정보를 외부 hidden state로 출력할지 결정**합니다.
>
> $o_t=\sigma(W_o[x_t,h_{t-1}]+b_o)$
>
>
> $h_t=o_t\odot\tanh(c_t)$
>
>

LSTM의 핵심은 **cell state를 통해 정보를 비교적 안정적으로 긴 시간 동안 전달하는 것**


---


3. GRU


![Notion image](/notion-assets/reading-note-attention-is-all-you-need/3b114b84a0f2807f81ebe058c68e4146.png)


Source: IBM Official documentation, [https://developer.ibm.com/learningpaths/get-started-with-deep-learning/deep-learning-architectures/](https://developer.ibm.com/learningpaths/get-started-with-deep-learning/deep-learning-architectures/)


GRU는 **Gated Recurrent Unit**의 약자입니다.


LSTM과 목적은 비슷하지만 구조를 더 단순하게 만든 모델입니다.


GRU에는 주로 두 가지 gate가 있습니다.

> **1. Reset gate :** 새로운 정보를 계산할 때 **이전 기억을 얼마나 참고할지** 결정합니다.
>
> $r_t=\sigma(W_rx_t+U_rh_{t-1}+b_r)$
>
>
> reset gate가 0에 가까우면 이전 기억을 거의 무시합니다.
>
>
> **2. Update gate :** **이전 기억을 얼마나 유지하고 새로운 기억으로 얼마나 바꿀지** 결정합

$z_t=\sigma(W_zx_t+U_zh_{t-1}+b_z)$


후보 hidden state를 계산합니다.


$\tilde{h}_t\tanh(W_hx_t+U_h(r_t\odot h_{t-1})+b_h)$


그리고 이전 기억과 후보 기억을 섞어 새로운 hidden state를 만듭니다.


$h_t(1-z_t)\odot h_{t-1}+z_t\odot\tilde{h}_t$


GRU는 LSTM과 달리 별도의 cell state가 없으며, **hidden state 하나로 기억을 관리**합니다.


---


4. LSTM과 GRU 비교


| 구분        | LSTM                      | GRU                  |
| --------- | ------------------------- | -------------------- |
| 전체 명칭     | Long Short-Term Memory    | Gated Recurrent Unit |
| 주요 gate   | Forget, Input, Output     | Reset, Update        |
| 상태        | Hidden state + Cell state | Hidden state만 사용     |
| 구조        | 상대적으로 복잡함                 | 상대적으로 단순함            |
| 파라미터 수    | 더 많음                      | 더 적음                 |
| 계산 속도     | 상대적으로 느릴 수 있음             | 상대적으로 빠를 수 있음        |
| 장기 정보 학습  | 가능                        | 가능                   |
| 기본 RNN 대비 | 기울기 소실 완화                 | 기울기 소실 완화            |


---


5. 기본 RNN과의 핵심 차이


| 구분            | 기본 RNN   | LSTM       | GRU        |
| ------------- | -------- | ---------- | ---------- |
| 정보 제어 gate    | 없음       | 3개         | 2개         |
| 별도 cell state | 없음       | 있음         | 없음         |
| 장기 의존성        | 학습하기 어려움 | 상대적으로 잘 학습 | 상대적으로 잘 학습 |
| 구조 복잡도        | 낮음       | 높음         | 중간         |
| 순차 계산 필요      | 필요       | 필요         | 필요         |

1. 기본 RNN → 기억 소실 문제
2. LSTM·GRU → gate를 사용해 기억 문제 완화 하지만 **순차 계산 문제**는 여전히 존재
    > The fundamental constraint of sequential computation, however, remains.
3. Transformer → recurrence 자체를 제거하고 **attention으로 병렬 처리**

그런데 지금까지는 Attention이 단순히 RNN과 결합하여 보조적인 방식으로만 사용되었음


→ Recurrence 대신 attention에 의존하는 Transformer를 만들자!


기대효과

> Transformer allows for significantly **more parallelization** and can reach a new state of the art in translation quality after being trained for **as little as twelve hours on eight P100 GPUs.**

## 3. Method

> **Self-attention**, sometimes called **intra-attention** is an attention mechanism relating different positions of a single sequence in order to compute a representation of the sequence.
>
>
> Self-attention에서는 각 단어가 **같은 문장 안의 다른 모든 단어를 참고한다.**
>
> > Self Attention은 일종의 soft한 dictionary.
>
> ![Notion image](/notion-assets/reading-note-attention-is-all-you-need/3b114b84a0f2803da8acebb7360866ba.png)
>
>
> Source: 3Blue1Brown 한국어, 「그 이름도 유명한 어텐션, 이 영상만 보면 이해 완료! - DL6, YouTube, [스크린샷 시점 06:12] 화면 캡처, [https://www.youtube.com/watch?v=_Z3rXeJahMs](https://www.youtube.com/watch?v=_Z3rXeJahMs)
>
>
> 예를 들어 `creature`이라는 단어를 처리할 때 다음과 같은 관계를 볼 수 있다.
>
> - 수식하는 표현이 무엇이 있는가? → `fluffy` , `blue`
>
> 즉, `creature`의 새로운 표현은 `creature`만 보고 만드는 것이 아니라 문장 전체와의 관계를 이용해 계산된다.
>
>
> **auto-regressive**
>
> : 모델이 **이전에 자신이 생성한 출력들을 입력으로 다시 사용하여 다음 출력을 하나씩 생성한다**
>
>
> 모델이 번역문을 한 단어씩 생성한다면 다음과 같이 작동
>
>
> ```plain text
> 1단계 입력: <START>
>         출력: 나는
>
> 2단계 입력: <START> 나는
>         출력: 고양이를
>
> 3단계 입력: <START> 나는 고양이를
>         출력: 좋아한다
>
> 4단계 입력: <START> 나는 고양이를 좋아한다
>         출력: <END>
> ```
>
>
> 즉, `고양이를` 생성할 때는 이전에 생성한 `나는`을 참고하고, `좋아한다`를 생성할 때는 이전에 생성한 `나는 고양이를`을 참고합니다.
>
>
> 이를 확률로 표현하면 전체 출력 시퀀스의 확률은 다음과 같이 분해됩니다.
>
>
> $P(y_1,y_2,\dots,y_T\mid x)=\prod_{t=1}^{T}P(y_t\mid y_1,\dots,y_{t-1},x)$
>
> - $x$: 입력 문장
> - $y_t$: 현재 생성할 출력 토큰
> - $y_1,\dots,y_{t-1}$: 이전까지 생성한 출력 토큰
>
> 핵심은 조건부 확률 $P(y_t∣y_{<t},x)$
>
> > 입력 $x$와 이전 출력 $y_{<t}$가 주어졌을 때, 다음 토큰 $y_t$의 확률을 계산한다
>
> ### Auto-regressive 모델의 장단점
>
>
> 장점
>
> - 이전 문맥을 반영하여 자연스러운 시퀀스를 생성할 수 있음
> - 출력 길이를 미리 정하지 않아도 됨
> - 번역, 문장 생성, 음성 생성 등에 적합함
>
> 단점
>
> - 추론할 때 토큰을 순차적으로 생성하므로 완전한 병렬화가 어려움
> - 앞에서 잘못 생성한 토큰이 이후 생성에도 영향을 줄 수 있음
> - 긴 출력을 생성할수록 시간이 오래 걸림
>

### 3.1. Training

> Training data and batching
- English-German (4.5M sentence pairs) : byte-pair encoding 방식으로 문장을 인코딩함 (37000개 정도의 token생성)
- English-French (36M sentences) : 마찬가지로 byte-pair encoding 방식으로 32000 word-piece vocabulrary 생성
- 각각의 training batch는 대략 25000 source token과 25000 target token이 있음
> Hardware and Schedule
- 8 NVIDIA P100 GPUs : 각각의 training step이 0.4초정도 걸림 (
    - base model : 100.000 스텝을 12시간 정도에 걸쳐 학습
    - big model : 300,000 스텝 | 3.5days
> Optimizer

Adam 사용하고 $\beta_1 = 0.9, \; \beta_2=0.98, \epsilon = 10^{-9}$

> Regulation

3가지의 reulgatrization을 적용했다고 한다

1. Sub-layer output에 Residual Dropout
2. Embedding과 Positional Encoding의 합에 Residual Dropout
    > **Residual Dropout이란?**
>
>     | 구성요소                | 역할                              |
>     | ------------------- | ------------------------------- |
>     | Residual connection | 원래 입력 정보를 보존하고 깊은 네트워크의 학습을 안정화 |
>     | Dropout             | 일부 특징을 무작위로 제거해 과적합을 완화         |
>     | LayerNorm           | 특징값의 분포를 정규화해 학습을 안정화           |
>
>
>     residual connection에서 **sub-layer가 새로 계산한 출력에 dropout을 적용한 뒤, 원래 입력과 더하는 방식**
>
>
>         → Residual branch, 즉 sub-layer가 만든 변화량에 dropout을 넣기 때문에 residual dropout이라고 부른다.
>
>
>     $\text{LayerNorm}(x+Dropout(\text{Sublayer}(x)))$
>
>
3. Label Smoothing
    > 정답 토큰에 확률 1을 몰아주는 대신, 일부 확률을 다른 클래스에 분산

    일반적인 one-hot label이 다음과 같다면:


    $[0,0,1,0]$


    Label smoothing을 적용하면 대략 다음처럼 됩니다.


    $[0.033,0.033,0.9,0.033]$


    정확한 분배 방식은 구현에 따라 달라질 수 있지만, 핵심은 **모델이 정답 클래스에 지나치게 확신하지 않도록 만드는 것**


---


## 4. Key Idea

> We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.

기존의 방법론들이 Attention을 활용하지 않는건 아니지만 **Transformer가 sequence-aligned RNN이나 Convolution을 활용하지 않고 입출력의 representation을 계산하기 위해 self-attention을 사용**한 첫번째 Transduction 모델이다.

> 왜 Transformer가 RNN, CNN 보다 유용할 수 있을까
> 1. layer 당 총 계산 복잡도 측면에서의 이익
> 2. parallelized 될 수 있는 계산량 측면에서의 이익
> 3. network 내부에서 long-range dependencies의 path length 측면에서의 이익
> 4. 더 해석 가능한 모델의 설계
>     > attention distribution을 통해 해석가능하다
> >
> >     → 각각의 attention head가 서로 다른 기능을 학습할 뿐만 아니라, 많은 head가 문장의 문법적 구조와 의미적 구조에 관련된 행동을 보이는 것으로 나타난다.
> >
> >
>
> **고전적인 RNN encoder–decoder에서는 입력 시퀀스의 정보를 최종 hidden state와 같은 제한된 표현에 압축하는 병목이 발생할 수 있다. 반면 Transformer는 각 입력 토큰의 문맥화된 표현을 유지하고, Decoder가 cross-attention을 통해 필요한 위치의 정보를 직접 참조한다.**
>
>

![Notion image](/notion-assets/reading-note-attention-is-all-you-need/3b114b84a0f280699118f1923f46dbe2.png)


Source: Original Document


![Notion image](/notion-assets/reading-note-attention-is-all-you-need/3b114b84a0f280f088aed969a3eae176.png)


Source: Original Documentation


### 4.1. Encoder of Model Architecture

> **Self-attention은 토큰 사이의 관계를 학습하고, position-wise FFN은 문맥이 반영된 각 토큰의 특징을 개별적으로 변환**
>
> → Self-attention은 **token mixing**, FFN은 **feature/channel mixing**
>
>

![Notion image](/notion-assets/reading-note-attention-is-all-you-need/3b114b84a0f280d3803aec1ff929f161.png)


Source: ChatGPT의 Visualize Tool


Encoder는 N=6의 동일한 layer로 구성된다


→ 각 layer는 두개의 sub-layer로 나뉘는데 첫째는 multi-head self-attention mechanism이고, 둘째는 간단한 position-wise fully connected feed-forward network이다. 그리고 **각 sub-layer를 개별적으로 residual connection과 layer normalization이 감싼다**

    > layer normalization (각 sub-layer의 출력이 $LayerNorm(x+Sublayer(x))$로 된다.

→ 결과적으로 embeeding layer 뿐만 아니라 모델의 모든 sub-layer의 출력 공간은 512이다 ( $d_{model} = 512$, $X\in\mathbb{R}^{n\times512} (\text{n은 입력 문장의 길이})$)


4.1.1. Multi-head self-attention

> **Self-attention의 의미**
>
> `self`는 `Query`, `Key`, `Value`가 모두 **같은 입력 시퀀스**에서 만들어진다는 뜻. 즉 각 토큰이 같은 시퀀스의 모든 토큰과 관련성을 계산
>
> > Key는 **관련성을 계산하기 위한 정보**이고, Value는 **실제로 전달할 정보**
>
> | 벡터        | 의미            | 역할                    |
> | --------- | ------------- | --------------------- |
> | Query (Q) | 찾고 싶은 정보      | 다른 토큰과의 관련성을 질문       |
> | Key (K)   | 자신이 가진 정보의 표지 | Query와 비교되어 관련성 점수 계산 |
> | Value (V) | 실제 전달할 정보     | 관련성 점수에 따라 가중합됨       |
>
>
> **Multi-head의 의미**
>
> Attention을 한 번만 수행하지 않고, **서로 다른 가중치를 가진 여러 attention을 병렬로 수행한다**
>
>
> 원 논문에서는 다음 설정을 사용
>
>
> $d_{\text{model}}=512,\qquad h=8$,  따라서 각 head의 차원은 다음과 같다.
>
>
> $d_k=d_v=\frac{512}{8}=64$
>
>

```plain text
512차원 입력
   ├─ Head 1: 64차원 Attention
   ├─ Head 2: 64차원 Attention
   ├─ Head 3: 64차원 Attention
   ├─ ...
   └─ Head 8: 64차원 Attention
          ↓
       이어 붙임
          ↓
       512차원
```

> 각 head는 **서로 다른 projection을 학습**하므로 **서로 다른 관계에 주목**할 수 있다. (e.g. 가까운 단어 관계, 주어와 동사의 관계, 멀리 떨어진 토큰 관계, 특정 위치나 문맥 관계)

다만 각 head가 반드시 사람이 해석할 수 있는 한 가지 문법 역할만 담당하는 것은 아니고 실제 역할은 학습 과정에서 결정된다.


$\operatorname{MultiHead}(Q,K,V) = \operatorname{Concat}(\text{head}_1,\ldots,\text{head}_8)W^O$


$\text{head}_i = \operatorname{Attention}(XW_i^Q,XW_i^K,XW_i^V)$


### Self-attention의 출력 차원


입력과 출력의 차원은 모두 512로 유지되고, 토큰 개수 n도 유지된다 $[n,512]\rightarrow[n,512]$


달라지는 것은 각 토큰 벡터가 이제 **다른 토큰들의 문맥 정보를 포함한다는 점**


---


4.1.2. Position-wise fully connected feed-forward network


`position-wise`는 **각 토큰 위치에 같은 fully connected network를 독립적으로 적용한다**는 뜻입니다.


Attention을 통과한 출력이 다음과 같다고 할때, Position-wise FFN은 각 토큰 벡터에 **동일한 함수를 적용**합니다.


$X=\begin{bmatrix}x_1 \\ x_2 \\ \vdots \\ x_n\end{bmatrix},\qquad x_i\in\mathbb{R}^{512}$


$\operatorname{FFN} (x) = \max(0,xW_1+b_1)W_2+b_2$


원 논문의 차원은 다음과 같습니다.


$512\rightarrow2048\rightarrow512,\; y_i=\operatorname{FFN}(x_i)$


모든 위치에 같은 $(W_1,W_2,b_1,b_2)$를 사용합니다. 다만 Encoder의 서로 다른 layer끼리는 FFN 파라미터를 공유하지 않습니다.

> **왜 position-wise라고 하는가**

이 FFN은 한 번 계산할 때 다른 토큰 위치를 직접 참고하지 않기 때문


예를 들어 두 번째 토큰을 처리할 때:


$y_2=\operatorname{FFN}(x_2)$ 이며, FFN 자체는 $x_1$이나 $x_3$를 입력으로 받지 않습니다.


따라서 역할을 구분하면 다음과 같습니다.


| 구성요소              | 정보를 섞는 방향      |
| ----------------- | -------------- |
| Self-attention    | 서로 다른 토큰 위치 사이 |
| Position-wise FFN | 한 토큰의 특징 차원 사이 |


---


### 4.2. Decoder of Model Architecture


![Notion image](/notion-assets/reading-note-attention-is-all-you-need/3b114b84a0f2803196cef1e9434f5868.png)


Source: ChatGPT의 Visualize Tool


Decoder도 Encoder와 마찬가지로 6개의 동일한 layer로 구성되어있고 각각의 layer에는 3개의 sub-layer가 들어가 있으며 그 중 첫번쨰 두번쨰는 Encoder와 동일하게 multi-head self-attention과 position-wise FFN이다.


→ 여기서 세번째 sub-layer로 들어오는게  바로 **masked** multi-head self-attention이다.


→ decoder에서는 encoder와는 달리 입력받는 sequence position 다음의 토큰을 출력하는 것이 목적이기에 입력받은 position 뒤의 position을 볼 수 없게 마스킹할 필요가 있다. 그렇기 때문에 도출한 position $i$에 대한 prediction이 $i$보다 작은 positions로만 기반했다라고 할 수 있기 때문이다.


### 4.3. Attention

> An attention function can be described as **mapping a query and a set of key-value pairs** to an output, where the query, keys, values, and output are all vectors.
>
> 어텐션이란 결국 **쿼리와 키밸류쌍을 매핑**해주는 것.
>
>

![Notion image](/notion-assets/reading-note-attention-is-all-you-need/3b114b84a0f280668d5fd03bb15fdc0d.png)


Source: Original Documentation, Attention sub-layer Visualization


Multi-Head Attention
= 여러 개의 Scaled Dot-Product Attention을 병렬로 실행 → 결과를 연결 → 최종 Linear 변환

> 논문의 경우 `h = 8 parallel attention layers, or head`

4.3.1. Scaled Dot-Product Attention


입력값은 $d_k$ 차원의 queries ($Q$)와 keys ($K$), $d_v$차원의 values ($V$)가 들어온다. 모든 key에 대해 query를 내적연산을 해준뒤, 입력의 key 차원 $\sqrt{d_k}$으로 나누어 준 뒤 softmax function을 도입해 weight 값을 value에 적용해준다

> $\text{Attention}(Q,K,V)=\text{softmax}(\frac{QK^T}{\sqrt{d_k}})V$

논문에 따르면, attention function으로 많이 사용되는 함수는 additive attention과 dot-product (또는 multiplicative) attention이다.

    - additive attention의 경우 feed forward network와 단일 은닉층을 활용해서 compatibility function을 계산하는데, 둘은 이론적인 복잡성 면에서는 비슷하지만 내적 방식의 경우 실제 구현에서는 훨ㅆ니 더 빠르고 공간복잡성에서 효율성을 보여준다고 한다.

        → 최적화된 배열 연산 코드로 구현가능하기 때문

    - 또한 $d_k$가 작을때는 두 방식이 비슷하게 작동하고, $d_k$가 커질때는 $d_k$**에 대해 스케일링을 하지 않는다라는 전제 하에** 덧셈 방식이 훨씬 성능이 좋다고 한다. 그렇기에 연구진은 이번 케이스는 $d_k$가 큰 경우이기에 $\frac{1}{d_k}$를 통해 스케일링을 해주어 내적 차원이 커지고, 그 결과 **내적값의 분포가 더 넓어져 절댓값이 커지는 경향**을 방지했다.
        - 만약 내적값의 분포가 넓어지는 경우, 이에 따라 softmax 결과값도 극단적으로 0과 1에 가까워지기에 gradient가 대부분의 위치에서 작아져 학습이 불안정하거나 느려질 수 있다 (SGD)

4.3.2. Applications of Attentions in Transformer


| Attention 종류                  | Query (Q)               | Key, Value (K,V) | 볼 수 있는 범위  |
| ----------------------------- | ----------------------- | ---------------- | ---------- |
| Encoder self-attention        | Encoder 이전 층 출력         | Encoder 이전 층 출력  | 입력 전체      |
| Decoder masked self-attention | Decoder 이전 층 출력         | Decoder 이전 층 출력  | 현재와 이전 출력만 |
| Encoder–decoder attention     | Decoder 이전 sub-layer 출력 | Encoder 최종 출력    | 입력 전체      |


4.3.3. Position-wise Feed Forward Networks

> ReLU Activation이 적용된 모습.

$FFN(x) = max(0, xW1 + b1)W2 + b2$


### 4.4. Positional Encoding

> Self-attention만으로는 토큰의 순서를 구분할 수 없기 때문에, sequence 내부 각 토큰 embedding에 relative/absolution position 정보를 추가한다.

$PE_{(pos,2i)} = sin(pos/10000^{2i/d_{model}}) \\P E_{(pos,2i+1)} = cos(pos/10000^{2i/d_{model}} )$

- $pos$ : position, $i$ : dimension
- 홀수 차원은 cos, 짝수 차원은 sin
> sinusoid : 삼각함수 **사인(sine) 곡선 모양**을 가진 주기적인 파동
> The wavelengths form a geometric progression from 2π to 10000 · 2π.
>
> → 각 차원의 파장이 일정한 값만큼 더해지는 것이 아니라, 일정한 비율로 커진다는 뜻
>
>
> **유일성 보장은 어떤 방식으로 가능한가?**
>
> Transformer는 각 주파수마다 sine과 cosine을 한 쌍으로 사용합니다. $[sin(θ),cos(θ)]$
>
>
> 이 두 값은 **단위원 위의 한 점**을 나타냅니다. $(cosθ,sinθ)$
>
>
> 사인값만 보면 0과 π를 구분하지 못하지만, cosine까지 함께 보면 구분할 수 있습니다.
>
>
> :$[sin0,cos0]=[0,1] \;\;\;\;\;[sinπ,cosπ]=[0,−1]$
>
>
> 즉, sine과 cosine을 같이 사용하면 **한 주기 안에서는 각도를 고유하게 구분**할 수 있습니다.
>
>
> 하지만 여전히 **전체적으로는 주기적**입니다.
>
>
> $[sinθ,cosθ]=[sin(θ+2π),cos(θ+2π)]$
>
>
> 따라서 **한 쌍만으로는 무한한 위치를 완전히 구분하지 못합니다**
>
>
> 하지만 Transformer에서는
>
>     1. sine과 cosine을 쌍으로 사용하고,
>     2. 서로 다른 여러 주파수를 사용하며,
>     3. 그 값들을 512차원 벡터로 조합합니다.
>

$sin(pos+k)=sin(pos)cos(k)+cos(pos)sin(k)$


$cos(pos+k)=cos(pos)cos(k)−sin(pos)sin(k)$


즉 $pos+k$의 sine과 cosine 값은 $pos$의 sine과 cosine을 선형적으로 조합해서 나타낼 수 있다.


행렬로 표현하면:


$\begin{bmatrix}\sin(pos+k)\\\cos(pos+k)\end{bmatrix}=\begin{bmatrix}\cos k & \sin k\\-\sin k &\cos k\end{bmatrix}\begin{bmatrix}\sin pos\\\cos pos\end{bmatrix}$


그래서 저자들은 모델이 다음과 같은 상대적 관계를 배우기 쉬울 것이라고 생각함.

> … because we hypothesized it would allow the model to easily learn to attend by relative positions, since for any fixed offset k, $PE_{pos+k}$can be represented as a linear function of $PE_{pos}$

## 5. Result


|            | WMT 2014 Englishto-German | WMT 2014 English-to-French |
| ---------- | ------------------------- | -------------------------- |
| This paper | 28.4 (BLEU) / +2 BLEU     | 41.8 (BLEU) /SOTA          |

- 번역 작업에선 기존의 Recurrent 기반이나 Convolutional 기반의 아키텍쳐보다 훨씬 빠를뿐만 아니라 번역 결과 역시 최고 성능을 찍었다.

![Notion image](/notion-assets/reading-note-attention-is-all-you-need/3b114b84a0f28070b2a6fe513dcc88cf.png)


Source: Original Documentation


![Notion image](/notion-assets/reading-note-attention-is-all-you-need/3b114b84a0f28055bae8d848cab33470.png)


Source: Original Documentation


(A) : the number of attention heads and the attention key and value dimensions,keeping the amount of computation constant

    > head의 증가가 반드시 성능의 증가로 이어지는 건 아님

(B) : Reducing the attention key size $d_k$ hurts model quality

> We further observe in rows (C) and (D) that, as expected, **bigger models are better, and dropout is very helpful** in avoiding over-fitting

![Notion image](/notion-assets/reading-note-attention-is-all-you-need/3b114b84a0f28031a333c80bd894242e.png)


Source: Original Documentation

> Transformer가 기계번역에만 특화된 모델이 아니라, **다른 시퀀스 문제에도 일반화되는지** 확인
>
> e.g. English constituency parsing(문장 성분 구문 분석)
>
>     - **학습 데이터가 제한된 경우**
>     - **추가 데이터를 활용한 semi-supervised 환경**
>
> → task-specific tuning이 거의 없었는데도 기존 전문 parser들과 비슷한 성능을 냈다.
>
>

Semi-supervised Learning이란 무엇인가?


Semi-supervised learning은:

> 소량의 정답 라벨이 있는 데이터와, **많은 라벨 없는 데이터**를 함께 사용하는 학습 방식

Semi-supervised 방식에서는 **기존 parser로 라벨 없는 문장의 구문 트리를 임시로 생성**한 뒤, 이를 추가 학습 데이터처럼 사용할 수 있습니다.


```plain text
라벨 있는 WSJ 데이터
        ↓
초기 parser 학습
        ↓
라벨 없는 문장에 임시 구문 트리 생성
        ↓
기존 데이터 + 임시 라벨 데이터로 재학습
```


이처럼 모델이 생성한 임시 라벨을 사용하는 방식을 흔히 **pseudo-labeling** 또는 구문 분석 문맥에서는 **self-training**이라고 합니다.


→ Pseudo-label에 오류가 있더라도 전체적으로 맞는 정보가 더 많다면 유용할 수 있습니다.


    예를 들어 초기 parser의 정확도가 충분히 높아 추가 문장 100만 개 중 대부분의 구조를 올바르게 예측한다면, 일부 오류가 포함되어 있어도 학습 데이터의 규모가 크게 증가합니다.


→ 물론 semi-supervised learning의 한계도 존재


초기 parser가 특정 구조를 반복해서 틀리면:


```plain text
초기 모델의 편향
→ 잘못된 pseudo-label 생성
→ 최종 모델이 같은 오류 학습
→ 편향 강화
```


가 발생할 수 있습니다. 이를 **confirmation bias라고 한다.**

>
>
> semi-supervised 학습의 핵심 질문은 “pseudo-label이 모두 맞는가?”가 아니라 다음입니다.
>
> > 일부 오류가 있는 추가 학습 데이터를 사용했을 때, 인간 정답 테스트 세트에서 최종 모델의 성능이 실제로 향상되는가?
>

### BLEU란 무엇인가?

> Bilingual Evaluation Understudy, **기계번역 결과가 사람이 작성한 기준 번역문과 얼마나 비슷한지** 측정하는 자동 평가 지표
>
> → 모델 번역문과 정답 번역문에서 연속된 단어 묶음인 **n-gram**이 얼마나 일치하는지 계산
>
>

BLEU는 기본적으로 모델이 생성한 n-gram 중 기준 번역에도 존재하는 비율을 계산합니다.


$p_n=\frac{\text{기준 번역과 일치하는 n-gram 수}}{\text{모델 번역에 포함된 전체 n-gram 수}}$


**이러한 측면에서 modified n-gram precision이라고도 한다.**


Brevity Penalty


모델이 아주 짧은 문장만 생성하면 precision이 높아질 수 있습니다.


기준 문장:


```plain text
the cat is sitting on the mat
```


모델 출력:


```plain text
the cat
```


출력된 두 단어는 모두 맞으므로 단순 precision은 높지만 좋은 번역은 아닙니다. 이를 방지하기 위해 BLEU는 출력 문장이 지나치게 짧으면 **brevity penalty**, 즉 길이 패널티를 부여합니다.


$BP=\begin{cases}1 & c>r\\e^{1-r/c} & c\le r\end{cases}$

- $c$: 모델 번역 길이
- $r$: 기준 번역 길이

$BLEU=BP\cdot\exp\left(\sum_{n=1}^{N}w_n\log p_n\right)$


일반적으로 N=4이고, 1-gram부터 4-gram까지 동일한 가중치를 사용합니다.


BLEU 점수 해석


BLEU는 보통 0에서 100 사이의 값처럼 표현됩니다.

- BLEU 0: 기준 번역과 거의 일치하지 않음
- BLEU 100: 기준 번역과 완전히 일치

다만 실제 계산값은 0에서 1 사이로 나온 뒤 100을 곱해 표시하는 경우가 많습니다.


중요한 점은 다음과 같습니다.

> BLEU 28.4는 번역 정확도가 28.4%라는 뜻이 아닙니다.

BLEU는 단어 및 n-gram 일치도, 문장 길이 패널티를 결합한 별도의 점수입니다.


또한 BLEU 2점 상승도 정확도 2% 상승과 같은 의미가 아닙니다. **동일한 데이터셋과 동일한 계산 조건에서 모델끼리 비교할 때 의미**가 있습니다.


## 6. Limitation


Transformer는 RNN의 순차 연산을 제거해 병렬화와 장거리 의존성 학습을 개선했지만, full self-attention의 $O(n^2)$복잡도로 인해 **긴 시퀀스 처리 비용**이 크다.


또한 순서·지역성에 대한 **inductive bias가 약하고**, 원 논문의 실험이 기계번역과 구문 분석에 집중되어 있어 비디오와 같은 **다른 데이터 유형에서의 효과는 추가 검증이 필요하다**.


Attention pattern 역시 모델 판단의 완전한 설명으로 해석하기 어렵다.


## 7. Connection to My Research

1. **프레임 또는 영상 구간을 토큰으로 볼 수 있다** → 단 이는 영상이기 때문에 ViT 이후에 가능할 것 같다
2. 긴 시퀸스 처리 비용의 한계를 어떻게 극복했을까?

## 8. What I Can Apply


## 9. Next Step
