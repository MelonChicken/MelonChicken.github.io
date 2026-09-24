---
title: "[Reading Note] An Image is Worth 16×16 Words: Transformers for Image Recognition at Scale"
slug: "reading-note-an-image-is-worth-1616-words-transformers-for-image-recognition-at-scale"
generated: true
status: "completed"
domain:
  - "Computer Vision"
  - "Transformer"
summary: "원래 Transformer의 구조를 최대한 가져온다. 이미지를 작은 패치들로 나누고 이 패치들에 대해 선형적인 임베딩 시퀀스를 Transformer 입력값으로 제공한다. patches를 일종의 tokens로 바라보는 것."
type: "paper-review"
researchFields:
  - "Computer Vision"
featured: true
methods:
  - "Multi-Head Attention"
  - "Fine-Tuning"
  - "Semi-supervised Learning"
date: "2026-08-04"
paperUrl: "https://arxiv.org/abs/2010.11929"
notion: "https://app.notion.com/p/Reading-Note-An-Image-is-Worth-16-16-Words-Transformers-for-Image-Recognition-at-Scale-3b114b84a0f28070b047fce07278a716"
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

> **Title:** An Image is Worth 16×16 Words: Transformers for Image Recognition at Scale
>
> **Authors:** Alexey Dosovitskiy, Lucas Beyer, Alexander Kolesnikov, Dirk Weissenborn, Xiaohua Zhai, Thomas Unterthiner, Mostafa Dehghani, Matthias Minderer, Georg Heigold, Sylvain Gelly, Jakob Uszkoreit, Neil Houlsby
>
>
> **Affiliation:** Google Research, Brain Team
>
>
> **arXiv ID:** arXiv:2010.11929
>
>
> **Topic:** Vision Transformer, Image Classification, Self-Attention, Image Patch Embedding, Transfer Learning, Computer Vision
>
>
> **Venue:** International Conference on Learning Representations 2021 (ICLR 2021)
>
>
> **Pages:** 22 pages
>
>

## 1. One-line Summary

> Transformer의 구조를 그대로 가져온 Vision Transformer는 CNN 기반의 ResNet보다 많은 데이터를 요구하지만 large-scale이 될수록 더 성능이 잘 오른다.

## 2. Problem

> Transformer가 NLP Task에서 사실상의 표준이 된건 맞지만 Computer Vision 분야에서는 아직 활용이 제한된다. 이 연구 이전까지는 attention은 주로 CNN에서의 Conjunction, 연결부를 담당하거나 CNN의 전체 구조는  유지하면서 일부 특정 요소를 대체하기 위한 용도로만 활용되었다.
- 이 논문 기준 그때까지의 주요 흐름은 큰 말뭉치 (Large Text Corpus)에 사전 학습을 시키고 상대적으로 작은 task-specific dataset에 세부 조정 (fine-tune)하는 방식이었다
- 하지만 Computer Vision 분야에서는 Convoulational Architecture가 지배적인 흐름이었다.
    - NLP 사례에 자극받아 합성곱을 완전히 대체하려는, self-attention을 활용한 CNN 스러운 architecture를 구상한 사례는 있었다.
    - 하지만 이론적인 효율성은 입증했으나, 특화된 어텐션 패턴 (specialized attention patterns) 의 한계로 인해 현대의 하드웨어 (GPU, TPU)에서 효율적으로 병렬연산을 하기란 어려웠다
        > **Specialized attention pattern**이란?
>
>         일반 Transformer의 **모든 토큰이 모든 토큰을 보는 dense self-attention**과 달리, 특정 규칙에 따라 **일부 토큰끼리만 attention을 계산**하도록 설계한 패턴
>
>         - 가까운 위치의 토큰만 보는 **local attention**
>         - 일정 간격의 토큰만 연결하는 **strided attention**
>         - 일부 대표 토큰을 통해 정보를 전달하는 **global/local attention**
>         - 미리 정해진 희소 연결 구조를 사용하는 **sparse attention**
>
        > Specialized attention pattern은 GPU나 TPU에서 왜 효율적인 병렬 연산이 어려웠을까?
>
>         **→ GPU/TPU가 선호하는 계산 형태와 계산 형태가 다르기 때문**
>
>
>         일반적인 dense self-attention은 모든 토큰 쌍의 점수를 한꺼번에 계산한다.
>
>
>         $QK^\top$
>
>
>         예를 들어 토큰이 1,000개라면 $1{,}000 \times 1{,}000$ 크기의 행렬을 계산 → 연산량은 많지만, 하나의 큰 **규칙적인 행렬 곱셈**으로 처리할 수 있다.
>
>
>         반면 sparse/local attention은 전체 중 일부만 계산
>
>
>         ```plain text
>         Dense attention
>         토큰 1 → 1, 2, 3, 4, 5
>         토큰 2 → 1, 2, 3, 4, 5
>         토큰 3 → 1, 2, 3, 4, 5
>
>         Local attention
>         토큰 1 → 1, 2
>         토큰 2 → 1, 2, 3
>         토큰 3 → 2, 3, 4
>         ```
>
>
>         계산해야 할 attention 값은 줄지만 다음 문제가 생깁니다.
>
>         1. 불규칙한 행렬 곱셈
>
>             각 토큰이 보는 대상이 다르므로 하나의 규칙적인 행렬 곱셈으로 묶기 어렵습니다.
>
>         2. 불규칙한 메모리 접근
>
>             GPU는 연속된 메모리의 데이터를 한꺼번에 읽을 때 효율적입니다.
>
>
>             Dense attention에서는 행렬 전체를 연속적으로 읽을 수 있지만, specialized attention에서는 다음처럼 흩어진 위치를 읽어야 하는 상황도 있기에 실제 계산보다 **메모리 이동 비용**이 병목이 될 수 있다.
>
>         3. 병렬 작업의 크기의 비 균일성
>
>             GPU는 수많은 연산을 같은 방식으로 동시에 실행합니다. 그런데 토큰마다 attention 대상 수가 다르면 어떤 연산 장치는 먼저 끝나고, 다른 장치는 계속 계산하게 된다. (Idle GPU)
>
>         4. 별도의 전용 연산 구현이 필요
>
>             Dense attention은 이미 고도로 최적화된 행렬 곱셈 라이브러리를 사용할 수 있습니다. 반면 sparse, local, strided attention은 각각의 패턴에 맞는 **별도 GPU 커널**이 필요할 수 있다.
>
>

## 3. Method


![Notion image](/notion-assets/reading-note-an-image-is-worth-1616-words-transformers-for-image-recognition-at-scale/3b414b84a0f28039993ded005cf0d5a2.png)


Source : ChatGPT’s Visualization about Related Works


![Notion image](/notion-assets/reading-note-an-image-is-worth-1616-words-transformers-for-image-recognition-at-scale/3b414b84a0f280c4b3aafd0e4bf758c4.png)


Source: Original Document


[https://www.youtube.com/watch?v=TrdevFK_am4&t=640s](https://www.youtube.com/watch?v=TrdevFK_am4&t=640s)


> 💡 **Transformer는 MLP보다 더 범용적인 모델인가? (귀납적 편향성을 가진 모델들과 비교)**
> 영상에서 언급된 'Transformer가 MLP(다층 퍼셉트론)보다 더 일반적(general)인 구조'라는 말은 **데이터 간의 연결(가중치)이 고정되어 있느냐, 아니면 동적으로 계산되느냐**의 차이를 의미합니다
>
> 1. **MLP의 한계:** 일반적인 MLP는 입력 노드와 출력 노드 사이의 연결 가중치가 학습 과정에서 정해지면 이후에는 **고정(fixed)**됩니다. 즉, 입력값이 바뀌어도 연결 방식은 동일하게 유지됩니다.
>
> 2. **Transformer의 유연성:** Transformer의 핵심인 '어텐션(Attention)' 메커니즘은 입력 데이터들을 보고 **실시간으로(on-the-fly) 서로 간의 가중치를 계산**합니다. 어떤 데이터가 서로 중요한지 모델이 매번 새롭게 판단하는 것이죠.
>
> 3. **결론:** 따라서 Transformer는 입력 데이터에 따라 구조가 유연하게 변하는 '범용 계산기'와 같으며, CNN이나 LSTM처럼 특정 목적을 위해 설계된 강한 '귀납적 편향(Inductive Bias)'을 가진 모델들보다 훨씬 **범용적(general)**이라고 평가하는 것입니다


### 3.1. Structure of ViT

>
>
> $z_{l−1}→LayerNorm→MSA→Residual Add→z_l^′\\ →LayerNorm→MLP→Residual Add→z_l$
>
>
> 이 과정을 $L$번 반복한 뒤, 마지막 출력의 `class token`을 꺼냅니다.
>
>
- Standard Transformer가 Token embedding으로 이루어진 1D sequence를 입력값으로 받는다
- 그렇기에 ViT도 $\bold x\in\R^{H\times W\times C}$의 이미지를 평탄화(Flattened)된 2D 패치들인 $\bold x_p\in \R^{N\times (P^2• C)}$로 이루어진 sequnce로 변환한다.
    - $(H, W)$ : 원본 이미지의 해상도 resolution
    - $C$ : 채널 수
    - $(P, P)$ : 각 이미지 패치의 해상도 resolution
    - $N = HW/P^2 (= \frac{H}{P}\times\frac{W}{P})$ : 생성되는 패치의 수 (Transformer의 효과적인 입력 sequence의 길이)
    > $(H,W,C)→N×(P,P,C)→N×(P^2C)→N×D→(N+1)×D$
- Transformer의 모든 layer에는 잠재 벡터 사이즈 $D$를 상수로 사용하는데 이로써 패치를 평탄화하고 $D$ 차원을 학습 가능한 linear projection을 진행한다.

    $\bold z_0 = [\bold x_{class}; \; \bold x^1_p\bold E; \; \bold x^2_p\bold E; \dots; \; \bold x^N_p\bold E] + \bold E_{pos} \\\bold E\in\R^{(P^2•C)\times D},\; \bold E_{pos},\bold z_i\in\R^{(N+1)\times D} \;\;\;\; \bold x^i_p\bold E \in \R^D$

        > $z_l^i$의 표기 방식
>         - $l$: Transformer 층 번호
>         - $i$: 토큰의 위치
>         - $i=0$: 맨 앞의 class token
>         - $i=1,…,N$: 이미지 패치 토큰
>
- BERT의 `[class]` 토큰과 유사하게, 학습 가능한 임베딩 하나를 임베딩된 패치 시퀀스 앞에 붙인다. 이 토큰의 초기값은 $\bold z_0^0=\bold x_{class}$이고, Transformer Encoder의 마지막 층을 통과한 뒤 얻는 상태 $z_L^0$를 이미지 표현 $y$로 사용한다.
    - $\bold z^0_0$: Encoder 입력 전 class token
    - $\bold z_L^0$: 마지막 L번째 Encoder 층을 통과한 class token

        $\bold z^′_l = MSA(LN(\bold z_{l−1})) + \bold z_{l−1}, \;\;\;\; l=1,..., L$


        $\bold z_l = MLP(LN(\bold z^′_l)) + \bold z^′_l, \;\;\;\; l=1,..., L$


        $\bold y = LN(\bold z^0_L)$

        >
>         - $LN$ : Layer Norm
>         - $MSA$ : Multi-Head Self-Attention
>

Layer Normalization (LN)이란?

> **Layer Normalization(LN)**은 한마디로 **각 토큰 벡터의 값들의 스케일을 일정하게 정돈해서, 다음 연산이 안정적으로 이루어지게 하는 역할**을 합니다.

**ViT에서 하나의 토큰은 여러 특징값을 가진 벡터입니다**


예를 들어 embedding dimension (D=4)인 패치 토큰 하나가 있다고 하겠습니다. $z=[2,;4,;6,;8]$


LayerNorm은 이 토큰 안의 4개 feature를 대상으로 **평균과 분산을 계산**합니다.


$\mu=\frac{2+4+6+8}{4}=5$


그리고 각 feature를 대략 $\hat{x}_i=\frac{x_i-\mu}{\sqrt{\sigma^2+\epsilon}}$와 같이 정규화합니다. 결과적으로 값들이 대략 $[-1.34,;-0.45,;0.45,;1.34]$처럼 **평균 0, 분산 1에 가까운 범위**로 정돈됩니다.


중요한 점은 이미지 전체나 batch 전체가 아니라 **각 토큰 하나하나에 대해 embedding dimension 방향으로 정규화한다**는 것입니다. ViT 입력이 $[B,N,D]$ 라면 LayerNorm은 각 $(B,N) $위치의 $D$개 값에 적용됩니다.


---

> 그런데 단순히 값을 작게 만드는 것이 목적은 아닙니다. 핵심은 **토큰마다 feature 값의 크기가 제각각으로 변하는 것을 제어하는 것**입니다.
> 이전 층의 토큰 표현을 먼저 정규화해서 안정적인 범위로 만든 다음
>
> → Self-Attention으로 토큰 간 관계를 계산하고
>
>
> → 원래 정보를 residual connection으로 다시 더한다.
>
>
> $\bold z^′_l = MSA(LN(\bold z_{l−1})) + \bold z_{l−1}, \;\;\;\; l=1,..., L$
>
>
> Attention을 거친 표현을 다시 정규화 → MLP로 각 토큰의 특징을 변환 → 원래 표현을 residual로 더한다.
>
> $\bold z_l = MLP(LN(\bold z^′_l)) + \bold z^′_l, \;\;\;\; l=1,..., L$
>
>

**그렇다면 정규화하면 원래 정보가 사라지는 것 아닌가?**


여기서 두 가지 장치가 있습니다.

1. 첫째, LayerNorm에는 학습 가능한 $(\gamma,\beta)$가 있습니다.

    실제로는 단순히 $\frac{x-\mu}{\sigma}$에서 끝나는 게 아니라, $LN(x)=\gamma\frac{x-\mu}{\sqrt{\sigma^2+\epsilon}}+\beta$ 입니다.


    즉, 모델이 학습하면서 필요한 feature의 크기와 위치를 다시 조정할 수 있습니다.

2. 둘째, **Residual Connection으로 원본 (z)가 그대로 우회해서 전달됩니다.**

    따라서 LayerNorm은 원래 표현 자체를 영구적으로 바꿔버리는 것이라기보다, **MSA가 처리할 입력을 정돈해 주는 역할**이라고 보는 것이 좋습니다.


    CNN에서 익숙한 BatchNorm과 비교하면 차이가 명확합니다.


    |               | BatchNorm     | LayerNorm        |
    | ------------- | ------------- | ---------------- |
    | 주로 사용         | CNN           | Transformer      |
    | 정규화 기준        | Batch 통계 활용   | 각 토큰 자체의 feature |
    | Batch size 영향 | 있음            | 거의 없음            |
    | ViT에서         | 일반적으로 사용하지 않음 | 핵심 구성 요소         |

>
> > **LayerNorm은 각 패치/CLS 토큰의 feature들을 embedding dimension 기준으로 정규화하여, Transformer가 깊어져도 Attention과 MLP에 입력되는 값의 분포와 크기가 지나치게 흔들리지 않도록 해 학습을 안정화한다.**
>
> 그리고 ViT에서 특히 LN→MSA→Residual 순서인 것을 **Pre-LN Transformer**라고 합니다. 원래 _Attention Is All You Need_의 Transformer와 LayerNorm 위치가 다르다는 점도 ViT 구조를 볼 때 중요한 차이입니다.
>
>

Inductive bias


Locality를 batch와 stride를 통해 저장할 수 있는 CNN과 달리 ViT는 마지막의 MLP 층을 제외하면 보장하는 것이 없다. (Locality와 Translation equivariance의 제외)


Positional Embedding은 2D 위치에 대해서는 정보가 거의 없으며 (실험에 따르면 1,2,3의 임베딩과 (1,2), (1,3)의 임베딩은 별 차이가 없었다고 한다.) 패치간 모든 공간적인 연관성은 아예 맨땅에서부터 배워야 한다 → Transformer가 큰 규모의 데이터에 의존하게 되는 이유


    → 물론 이런 구조를 보완하기 위해 저자는 하이브리드 방식의 patch embedding proejction $\bold E$를 CNN feature map으로부터 추출한 patches에 적용하는 방법도 제시한다

    - 이떄 patches는 1 by 1의 크기를 지녀 입력 시퀀스가 단순하게 feature map의 공간 차원을 평탄화한뒤 transformer dimension에 투영하는 방식을 활용하기도 한다.

### 3.2. Fine-Tuning and higher resolution


**Image→Pretrained ViT Encoder→**$\bold z_L^0$**→New Linear Head→K classes**

> 일반적으로 ViT를 **큰 데이터셋에서 먼저 사전학습**한 뒤, 더 작은 downstream task에 맞게 fine-tuning한다. 이때 사전학습 때 사용했던 분류 head는 제거하고, **downstream task의 클래스 수 K에 맞는 새로운 D×K 크기의 feedforward layer**를 붙인다.
>
> 이 새 layer의 가중치는 0으로 초기화한다.
>
>     - 새로운 downstream classifier가 처음부터 임의의 큰 출력을 만들어 pretrained representation을 방해하지 않도록 안정적으로 fine-tuning을 시작하려는 의도
>
- 또한 fine-tuning할 때는 사전학습 때보다 더 높은 해상도의 이미지를 사용하는 것이 **종종 유리**하다.
    > **패치 크기 P는 그대로 유지하고 이미지 해상도를 높이기 때문**에 패치 토큰의 개수 N이 증가하며, 이에 맞춰 positional embedding만 공간적으로 interpolation한다

### 3.3. Implementation


[https://github.com/google-research/vision_transformer](https://github.com/google-research/vision_transformer)


> 💡 **왜 ViT 연구에서는 JAX가 매력적이었을까?**
> ViT 논문의 핵심은 단순히 Transformer를 이미지에 적용했다는 것뿐 아니라 **엄청나게 큰 데이터셋과 모델 규모로 pre-training했다**는 데 있습니다. 이런 환경에서는 GPU 한 장에서 편리하게 모델을 구현하는 것보다
>
> `수많은 accelerator`+`거대한 batch`+`TPU`+`분산 학습`
>
> 을 효율적으로 다루는 게 중요합니다.
>
> JAX는 애초에 CPU/GPU/TPU를 대상으로 XLA를 통한 compilation을 강하게 활용합니다. `jax.jit()`를 적용하면 여러 연산을 하나의 최적화된 계산으로 컴파일할 수 있고, 중간 allocation 제거나 operation fusion 등의 최적화가 가능합니다.
>
> 그리고 Google은 TPU 인프라를 적극적으로 사용하기 때문에 이 장점이 특히 컸습니다. 실제 ViT 레포의 Colab과 실행 설명 역시 GPU뿐 아니라 TPU 실행을 명시적으로 지원합니다.
>
> 그래서 당시 연구 환경을 단순화해서 보면:
>
> Google Research → 대규모 TPU infrastructure
> → JAX + XLA → Flax →ViT / MLP-Mixer 등
>
> 이라는 조합이 자연스러웠던 겁니다.

1. JAX + Flax 기반 구현
    - 공식 구현은 PyTorch가 아닌 **JAX + Flax Linen**을 사용한다.
    - `jax.numpy`를 tensor 연산에 사용하고, neural network module은 `flax.linen.nn.Module`로 정의한다.
    - `@nn.compact`와 `__call__()` 내부에서 layer를 정의하고 즉시 호출하는 Flax 특유의 구현 방식을 사용한다.

    ---

2. Pure ViT와 ResNet Hybrid를 하나의 모델에서 지원

    `VisionTransformer`에는 optional `resnet` 인자가 존재한다.


    ```python
    resnet: Optional[Any] = None
    ```

    - `resnet=None`: 일반적인 Pure ViT
    - `resnet` 지정: ResNet feature map을 Transformer 입력으로 사용하는 Hybrid ViT

    따라서 ResNet은 ViT의 필수 구성 요소가 아니라 **Hybrid architecture 지원을 위한 optional frontend**이다.


    Pure ViT:


    ```plain text
    Image
    → Patch Embedding
    → Transformer Encoder
    ```


    Hybrid ViT:


    ```plain text
    Image
    → ResNet
    → Feature Map
    → Patch Embedding
    → Transformer Encoder
    ```


    ---

3. Patch 생성 + Linear Projection을 Conv2D 하나로 구현

    논문에서는 이미지를 $P\times P$ patch로 분할한 뒤 각 patch를 flatten하고 linear projection한다.


    구현에서는 이를 별도로 수행하지 않고 다음 Conv2D 하나로 처리한다.


    ```python
    x = nn.Conv(
        features=self.hidden_size,
        kernel_size=self.patches.size,
        strides=self.patches.size,
        padding='VALID',
        name='embedding'
    )(x)
    ```


    `kernel_size = stride = patch_size`이므로 convolution 영역이 서로 겹치지 않는다.


    따라서 이 Conv는 일반적인 CNN feature extraction 목적이라기보다


    ```plain text
    Patch 분할
    +
    Flatten
    +
    Linear Projection
    ```


    을 한 번에 수행하는 **Patch Embedding layer**로 볼 수 있다. 코드에서도 Conv 출력은 `grid of embeddings`로 표현한 뒤 이를 sequence로 reshape한다.


    ---


4. 2D Patch Grid를 Transformer Token Sequence로 변환


    Patch embedding 이후 tensor는 아직 2차원 spatial structure를 유지한다.


    ```python
    x = jnp.reshape(x, [n, h * w, c])
    ```


    이를 통해


    ```plain text
    [B, H', W', D]
    →
    [B, N, D]
    ```


    형태로 변환한다.


    여기서 $N = H'W'$


    이며 각 patch embedding이 하나의 Transformer token이 된다.


    ---


ViT 공식 구현에서 눈에 띄는 점은 **논문의** **`Patchify → Flatten → Linear Projection`을 명시적으로 구현하지 않고,** **`kernel_size = stride = patch_size`인 Conv2D 하나로 동일한 연산을 구현했다는 것**이다.


또한 하나의 `VisionTransformer` 구현에서 Pure ViT와 ResNet-based Hybrid ViT를 모두 지원하도록 일반화되어 있다.


## 4. Key Idea


**원래 Transformer의 구조를 최대한 가져온다**

> 이미지를 작은 패치들로 나누고 이 패치들에 대해 선형적인 임베딩 시퀀스를 Transformer 입력값으로 제공한다
> - patches를 일종의 tokens로 바라보는 것.
>
> _To do so, we split an image into patches and provide the sequence of linear embeddings of these patches as an input to a Transformer._
>
>
- 하지만 완전히 해결책은 아닐 수 있다.

    → Transformer에는 CNN이 본래 가지고 있는 이동 등변성과 지역성과 같은 귀납적 편향이 부족하기 때문에, **충분하지 않은 양의 데이터로 학습**하면 **새로운 데이터에 잘 일반화하지 못한다.**


    → ViT가 본질적으로 이미지 처리에 부적합하다는 뜻이 아니라, CNN보다 이미지에 관한 사전 가정이 적기 때문에 그 자유도를 제대로 활용하려면 더 **많은 데이터가 필요하다**는 의미


    → public ImageNet-21k dataset or the in-house JFT-300M dataset


## 5. Result


|              | ILSVRC-2012 ImageNet dataset | ImageNet-21k | JFT                    |
| ------------ | ---------------------------- | ------------ | ---------------------- |
| # of Classes | 1K                           | 21K          | 18K                    |
| # of images  | 1.3M                         | 14M          | 303M (High resolution) |

> In particular, the best model reaches the accuracy of **88.55% on ImageNet**, **90.72% on ImageNet-ReaL**, **94.55% on CIFAR-100**, and **77.63% on the VTAB suite of 19 tasks**.
- 초기 단계에서 이미지를 패치로 잘라내는 것 외에는, **모델 구조에 이미지 전용 귀납적 편향을 따로 넣지 않았다.**
    > we do not introduce image-specific inductive biases into the architecture apart from the initial patch extraction step
>     - CNN에는 다음과 같은 image-specific inductive bias가 구조적으로 들어 있다.
>         - **Locality:** 가까운 픽셀끼리 먼저 처리함
>         - **Translation equivariance:** 같은 필터를 모든 위치에 적용함
>         - **2차원 구조:** 이미지의 가로·세로 공간 관계를 convolution 연산이 직접 활용함
>

![Notion image](/notion-assets/reading-note-an-image-is-worth-1616-words-transformers-for-image-recognition-at-scale/3b514b84a0f280c2b8b8e0b33a06923e.png)

> 학습 단계에서는 ResNet을 포함한 모든 모델에서 Adam Optimizer를 $\beta_1=0.9, \;\beta_2=0.999$로 사용하였고 batch size는 4096, high weight decay는 0.1로 두었는데 이 수치는 모든 모델에 대해서 유용하다고 저자들은 판단함.
>
> ![Notion image](/notion-assets/reading-note-an-image-is-worth-1616-words-transformers-for-image-recognition-at-scale/3b514b84a0f280a5a0c3fb9720915a3c.png)
>
>
> ![Notion image](/notion-assets/reading-note-an-image-is-worth-1616-words-transformers-for-image-recognition-at-scale/3b514b84a0f28018aa90f057a031bc37.png)
>
>
> Source: Original Document
>
>
> Fine-tuning에는 SGD with momentum을 batch size 512로 활용하였다.

![Notion image](/notion-assets/reading-note-an-image-is-worth-1616-words-transformers-for-image-recognition-at-scale/3b514b84a0f28086b47afba862f46dd4.png)


Source: Original Document

    - **Natural**: 일반적인 자연 이미지 분류
    - **Specialized**: 의료나 위성영상처럼 특정 도메인
    - **Structured**: 객체의 위치, 깊이, 방향처럼 공간적, 기하학적 구조를 요구하는 문제
> JFT에서 학습한 ViT representation이 원래 pre-training distribution과 다른 여러 종류의 task에도 유용하다.
> ViT의 global self-attention이 이미지 전체 patch 간의 관계를 직접 모델링하는 구조이기 때문에 spatial/structural information을 transfer하는 데 유리한가? 라는 질문에 대해 Figure 2의 Structued 그래프를 보면 답할 수 있다 (ViT가 **global relationship을 어떻게 학습하는가**를 분석할 동기를 제공)

VTAB 결과는 **ViT의 대규모 pre-trained representation이 다양한 downstream visual tasks로 잘 transfer됨**을 보여준다. 특히 Natural 및 Structured task에서 BiT(ResNet)보다 높은 성능을 보인 반면, Specialized task에서는 차이가 거의 없었다. 따라서 **ViT의 이점은 모든 도메인에 동일하지 않으며 task 특성에 따라 달라진다**. Structured task에서의 우위는 **global self-attention과의 관련성을 생각해볼 수 있으나, 해당 결과만으로 인과관계를 주장할 수는 없다.**

> **Q. 왜 ViT는 Structured task에서 상대적으로 강했을까? Self-attention의 global receptive field가 실제 원인인가?**

### 5.1. The importance of dataset size


5.1.1. ViT models on datasets of increasing size

> we optimize three basic regularization parameters – **weight decay**, **dropout**, and **label smoothing**
>
> | 방법              | 어디에 작용?       | 핵심 효과                  |
> | --------------- | ------------- | ---------------------- |
> | Weight decay    | 모델 파라미터       | weight가 지나치게 커지는 것을 억제 |
> | Dropout         | 중간 activation | 일부 뉴런/feature를 무작위 제거  |
> | Label smoothing | 정답 label      | 지나치게 확신하는 예측을 억제       |
>
> 1. Weight decay : **학습하면서 weight의 크기가 지나치게 커지지 않도록 제한하는 방식**
>
>     일반적인 loss가 $L(θ)$라면 개념적으로는 여기에 weight 크기에 대한 penalty를 추가합니다. $L_{total}=L(θ)+λ∥θ∥^2$
>
> 2. Dropout : 학습 중 일부 activation을 **확률적으로 0으로 만드는 방법**
> 3. Label smoothing : **정답(label)을 살짝 부드럽게 만드는 것**
>
>     → 모델의 **overconfidence를 줄이고 generalization을 개선**
>
>
>     일반적인 one-hot label:
>
>
>     ```plain text
>     cat   dog   car   bird
>     1.0   0.0   0.0   0.0
>     ```
>
>
>     Label smoothing을 적용하면 대략:
>
>
>     ```plain text
>     cat   dog   car   bird
>     0.9   0.033 0.033 0.033
>     ```
>
>

![Notion image](/notion-assets/reading-note-an-image-is-worth-1616-words-transformers-for-image-recognition-at-scale/3b514b84a0f280df9833f426e5bbc5c4.png)


Source : Original Document

> ViT의 model scaling은 data scaling과 함께 이루어져야 한다. 단순히 모델을 키운다고 해서 성능이 향상되지 않는다.

5.1.2. Linear few-shot evaluation on ImageNet versus pre-training size

> 적은 downstream supervision만 제공했을 때에도 대규모 pre-training으로 학습된 ViT representation의 품질 향상이 드러나는가?
> - **downstream supervision** : **pre-training이 끝난 모델을 실제 목표 과제에 맞게 학습시키기 위해 추가로 주는 정답 라벨 정보**
> >
> >
> > 예를 들어 ViT를 JFT-300M으로 먼저 pre-training했다고 하겠습니다.
> >
> >
> > ```plain text
> > JFT-300M
> >    ↓
> > ViT pre-training
> >    ↓
> > 이미지에 대한 일반적인 representation 학습
> > ```
> >
> >
> > 그다음 이 모델을 ImageNet 분류에 쓰려면 **ImageNet의 정답 라벨을 이용해 어떤 feature가 어느 class에 해당하는지 알려줘야 합니다.**
> >
> >
> > ```plain text
> > ImageNet image → "dog"
> > ImageNet image → "cat"
> > ImageNet image → "car"
> > ```
> >
> >
> > 이때의 **ImageNet 정답 라벨**이 **downstream supervision**
> >
> >
>
> upstream / pre-training → 대규모 데이터로 일반적인 표현 학습
>
>
> downstream task → 실제로 평가하려는 목표 과제
>
>
> downstream supervision → 그 목표 과제를 학습하기 위해 제공되는 정답 정보
>
>

![Notion image](/notion-assets/reading-note-an-image-is-worth-1616-words-transformers-for-image-recognition-at-scale/3b514b84a0f2803f8d02f490d28a57e9.png)


Source : Original Document

>
>
> **linear evaluation:**  pre-trained encoder를 고정(freeze)
>
>
> ```plain text
> ViT Encoder      ← Freeze
>         ↓
> Representation
>         ↓
> Linear classifier ← 이것만 학습
> ```
>
>
> 즉 모델이 이미 만들어 놓은 representation만 가져오고, 그 위에 아주 단순한 linear classifier만 학습
>
>
> ⇒ **pre-trained representation 자체가 얼마나 좋은가?**를 좀 더 직접적으로 평가
>
>
>
>
> Few-shot : 새로운 task를 학습할 때 **class당 극소수의 labeled example만 제공하는 설정**
>
>
> e.g. **Linear 5-shot ImageNet Top-1 : 5-shot**은 각 class에 대해 labeled example을 5개만 사용한다는 뜻
>
>
> few shot의 장점
>
> 1. 계산량 절약
> 2. pre-trained의 학습정도 검사
>     - 좋은 representation이라면 적은 label로도 분류되어야 함
>
>     linear few-shot accuracy가 높다는 것은 **pre-training 과정에서 downstream classification에 유용한 representation을 이미 학습했다**는 신호
>
>
> convolutional inductive bias (ResNet)는 작은 데이터에서는 유용하지만, 데이터가 충분히 많아지면 모델이 필요한 패턴을 데이터에서 직접 학습할 수 있으며, 오히려 그 편이 더 유리할 수 있다.
> 데이터의 규모가 작은 초반에는 ResNet이 성능이 더 좋지만 시간이 지날수록 성능 향상이 더디며 (Plateau Sooner), ViT의 성능이 더 우월해진다.

5.1.3. Performance versus pre-training compute for different architectures


![Notion image](/notion-assets/reading-note-an-image-is-worth-1616-words-transformers-for-image-recognition-at-scale/3b514b84a0f28075aad5c853ad8601a3.png)


Source: Original


![Notion image](/notion-assets/reading-note-an-image-is-worth-1616-words-transformers-for-image-recognition-at-scale/3b514b84a0f280f1a48ae5d914484de8.png)

> 같은 계산 제한을 가지고 있을때는 대체로 ViT가 ResNet보다 더 성능이 좋았다
> Hybrid (CNN+Transformer) 모델은 작은 규모에서는 pure ViT보다 유리하지만, 모델 규모가 커질수록 차이가 사라진다.
> CNN은 **data-efficient**하지만 **scaling이 상대적으로 빨리 포화**되고,
>
> ViT는 **data-hungry**하지만 **large-scale regime에서 더 잘 scaling**된다.
>
>

### 5.2. Scaling Study

- JFT-300M에서는 데이터 규모가 충분히 커서 모델 성능의 주요 병목이 **데이터 부족이 아니라 모델 및 계산량**이 된다.
- 동일한 transfer performance 기준에서 ViT는 ResNet보다 약 2-4배 적은 pre-training compute를 필요로 했다.
- Hybrid CNN+ViT는 작은 compute budget에서는 pure ViT보다 약간 우수하지만, 큰 모델에서는 차이가 사라진다.
- 실험 범위 내에서 ViT 성능은 saturation하지 않아 추가 scaling 가능성을 보였다.
> **Insight:** ViT의 장점은 대규모 데이터에서 높은 정확도를 얻는 것뿐 아니라, 성능 대비 compute efficiency와 scaling potential에도 있다.

### 5.3. Internal Representation Analysis


![Notion image](/notion-assets/reading-note-an-image-is-worth-1616-words-transformers-for-image-recognition-at-scale/3b514b84a0f2803ab1d8e33503c98555.png)


Source: Original Document


![Notion image](/notion-assets/reading-note-an-image-is-worth-1616-words-transformers-for-image-recognition-at-scale/3b514b84a0f28081b70ced42a8dc9cef.png)


![Notion image](/notion-assets/reading-note-an-image-is-worth-1616-words-transformers-for-image-recognition-at-scale/3b514b84a0f2807ebb6ee3f215e2d0c3.png)


Source: Original Document

- Patch projection은 **patch 내부의 저수준 visual structure를 표현**하는 basis-like filters를 학습한다.
- Learned positional embeddings는 별도의 2D 제약 없이도 **거리와 row/column 관계를 포함한 2D image topology를 학습**한다.
- Self-attention head는 **local/global attention을 모두 형성**하며, 일부 head는 초기 layer부터 이미지 전체의 정보를 통합한다.
- Pure ViT에서 나타나는 초기 local attention은 CNN의 early convolution과 유사한 역할을 할 가능성이 있다.

    → ViT는 CNN의 spatial inductive bias를 명시적으로 크게 부여하지 않아도, **충분한 학습을 통해** locality와 2D spatial structure를 스스로 획득하는 모습을 보인다.


### 5.4. Self-supervision on ViT

> BERT처럼 ViT역시 라벨이 없는 self-supervised learning을 하면 어떻게 될까?
>
> BERT의 masked language modeling task 처럼 masked patch prediction을 진행
>
>
- 단순히 처음부터 ImageNet classification을 학습하는 것보다 masked-patch 방식으로 먼저 representation을 학습한 뒤 fine-tuning하는 것이 약 2% 향상. 하지만 supervised pre-training에 비해서는 4% 뒤처짐
    > With self-supervised pre-training, our smaller ViT-B/16 model achieves 79.9% accuracy on ImageNet, a significant improvement of 2% to training from scratch

    → ViT의 높은 data requirement를 self-supervised learning으로 충족시킬 가능성이 있다. 하지만 본 논문의 단순한 masked-patch 방식은 아직 supervised pre-training보다 상당히 낮은 성능이었다.


    → ViT 계열에서 **MAE(Masked Autoencoders), BEiT, DINO** 같은 self-supervised vision pre-training 연구 참고


### 5.5. ViT의 global self-attention 대신 2D 구조를 더 직접 반영하는 Axial Attention을 쓰면 더 좋아지는가?

- Axial Attention은 flatten하지 않고 **행(row)과 열(column)을 따로 attention**
    > The general idea of axial attention is to perform **multiple attention operations**, each along a single axis of the input tensor, instead of applying 1-dimensional attention to the flattened version of the input

    e.g. AxialResNet model


    ![Notion image](/notion-assets/reading-note-an-image-is-worth-1616-words-transformers-for-image-recognition-at-scale/3b514b84a0f280958e75e37de4aed0f1.png)


    Source: Original Document

- 이미지가 본래 2D 구조인데 굳이 1D로 flatten하는 것보다, 2D 구조를 직접 유지하는 attention이 더 좋은가 → True, 5-shot linear accuracy
- 하지만 그만큼 계산 효율성은 나빠졌다.
- Axial Attention은 한 번의 global attention을 더 작은 row/column attention으로 분해하므로 attention 자체는 싸지나, 한 ViT block을 사실상 두 개의 axial block으로 바꾸면서 **MLP도 두 번** 들어간다.
- FLOPs만 보면 나쁘지 않았지만, 실제 TPU inference에서는 구현이 매우 느리다.
> 2D 구조를 명시적으로 반영한 Axial Attention은 **ViT의 성능을 향상**시킬 수 있었지만, **추가 MLP**와 **비효율적인 하드웨어 구현** 때문에 계산 비용과 실제 속도 측면에서는 이점이 명확하지 않았다.
>
> 따라서 단순한 global self-attention 기반 ViT가 성능과 구현 효율성 측면에서 여전히 경쟁력이 있었다.
>
>

## 6. Limitation


### 6.1. Limitations on paper

1. ViT의 적용 범위가 주로 **이미지 분류에 한정**되어 있다.
    > ViT를 Classification이 아니라 detection이나 segmentation에도 적용해보는 추가연구가 필요하다
2. Self-supervised pre-training의 성능이 대규모 supervised pre-training에 미치지 못한다.
    > 논문의 초기 실험에서는 **self-supervised pre-training을 통해 성능 향상**이 나타났지만, **대규모 라벨 데이터로 수행한 supervised pre-training과는 여전히 큰 성능 차이**가 존재한다. 따라서 **ViT에 적합한 self-supervised pre-training 방법**을 추가로 탐색하고 검증할 필요가 있다.
3. **ViT의 규모 확장에 대한 검증이 충분하지 않다.**
    > 저자들은 모델과 데이터의 규모를 더 확대하면 성능이 향상될 가능성이 있다고 보았지만, **어느 정도까지 확장이 효과적인지**와 **계산 비용 대비 성능 향상이 어떠한지**는 충분히 검증하지 않았다

### 6.2. Other Limitations

> 이 밖에 저자가 언급하지 않은 한계성
- **ViT의 우수한 성능은** **대규모 데이터와 높은 연산 자원에 크게 의존한다.**
    - 또한 데이터 자체도 in-house이기에 접근 불가능한 경우도 있다 (JFT)
    > The strongest ViT results and part of **its scaling analysis rely on JFT-300M**, a proprietary Google dataset unavailable to external researchers. Therefore, the exact large-scale experiments cannot be independently reproduced. However, subsequent studies such as DeiT and AugReg demonstrated that the effectiveness of ViT and its data/regularization characteristics can also be observed using publicly available datasets.

    → “논문이 재현 가능한가?”와 “논문의 과학적 주장이 이후 독립적으로 검증되었는가?”는 다른 질문

- **Full self-attention의 복잡도**$O(n^2)$**로 인해 고해상도 입력과 작은 패치 사용 시 계산 비용이 급격히 증가한다.**
- **고정 크기의 비중첩 패치 분할은 작은 객체, 경계 및 세밀한 지역 정보를 충분히 보존하지 못할 수 있다.**
    > 특히 16×16 패치는 이미지 분류에는 효율적이지만, 작은 객체나 정밀한 경계가 중요한 탐지·분할에서는 정보 단위가 지나치게 거칠어 정보 손실이 발생할 수 있다.
- **원래 ViT는 CNN의 계층적, 다중 스케일 특징 구조가 부족하고, 실제 환경의 강건성 및 효율성 평가도 제한적이다.**
    >
>
>     CNN은 일반적으로 `edge→texture→part→object`로 공간적 특징을 계층적으로 학습한다.
>
>
>     또한 층이 깊어질수록 **feature map의 해상도는 감소**하고 **receptive field는 넓어지는 다중 스케일 구조를 자연스럽게 형성한다**.
>
>
>     반면 원래의 ViT는 모든 **Transformer 층에서 토큰 수와 표현 차원이 거의 동일하게 유지**된다. 따라서 CNN처럼 저수준 지역 특징에서 고수준 의미 특징으로 점진적으로 변화하는 계층 구조가 명시적이지 않다.
>
>     - 그리고 **입력 해상도 변화에 자연스럽게 대응하지 못한다 (환경의 강건성)**
>
>         ViT는 학습 가능한 **absolute position embedding**을 사용 → 학습할 때와 다른 해상도의 이미지를 입력하면 패치 수가 달라지므로, 기존 position embedding의 크기가 입력 토큰 수와 맞지 않게 된다.
>
>

## 7. Connection to My Research

1. **프레임을 patch token으로 바꾸는 관점**

    : 동물 영상의 각 프레임을 단순 픽셀 덩어리가 아니라 여러 지역의 token 집합으로 볼 수 있다. 예를 들어 머리, 몸통, 발, 먹이통, 물통, 주변 환경 등이 서로 다른 patch token에 반영될 수 있다

2. **행동은 단일 객체가 아니라 여러 영역의 관계로 표현될 수 있음**

    : CNN은 지역적인 특징을 쌓아가지만, ViT는 self-attention을 통해 멀리 떨어진 영역도 직접 연결할 수 있으니 이를 활용해 행동의 맥락 정보를 더 얻을 수 있을 것 같다

3. **하지만 행동은 appearance만으로는 부족하다는 한계도 명확해짐**

    : ViT는 기본적으로 한 장의 이미지 모델입니다. 따라서 Feeding과 Resting처럼 자세나 주변 물체만으로 어느 정도 구별되는 행동에는 도움이 되지만, Walking, Exploring, Grooming처럼 **변화 자체가 중요한 행동**에서는 단일 프레임 ViT만으로 부족하다


## 8. What I Can Apply

- 대규모 visual pre-training 후 작은 downstream dataset에 fine-tuning하는 ViT의 학습 방식은 라벨링된 데이터가 부족한 동물 행동 분석 환경과 관련성이 높다.
- 이러한 관점은 향후 self-supervised video representation learning을 통해 대량의 unlabeled animal video를 활용하고, 적은 행동 라벨만으로 downstream behavior recognition을 수행하는 방향으로 확장할 수 있다.

## 9. Next Step
