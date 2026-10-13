---
title: "[Reading Note] Segment Anything"
slug: "reading-note-segment-anything"
generated: true
status: "completed"
domain: 
  - "Image Segmentation"
  - "Foundation Model"
summary: "SAM은 promptable segmentation, 대규모 supervised data engine, 범용 prompt interface를 통해 segmentation을 foundation-model paradigm으로 확장하려 했으며, 최고 수준의 domain-specific accuracy보다는 generalization과 composability를 우선한 모델이다."
type: "paper-review"
researchFields: 
  - "Computer Vision"
featured: true
methods: 
  - "Promptable Segmentation"
  - "Zero-Shot Learning"
date: "2026-10-05"
paperUrl: "https://segment-anything.metademolab.com/"
notion: "https://app.notion.com/p/Reading-Note-Segment-Anything-3f014b84a0f28097afbff96a88d3fcc5"
---

<!-- This file is generated from Notion. Do not edit directly. -->

## Paper Information

>
>
> <strong>Title:</strong> Segment Anything
>
> <strong>Authors:</strong> Alexander Kirillov, Eric Mintun, Nikhila Ravi, Hanzi Mao, Chloe Rolland, Laura Gustafson, Tete Xiao, Spencer Whitehead, Alexander C. Berg, Wan-Yen Lo, Piotr Dollár, Ross Girshick
>
> <strong>Affiliation:</strong> Meta AI Research (FAIR)
>
> <strong>arXiv ID:</strong> arXiv:2304.02643
>
> <strong>Topic:</strong> Image Segmentation, Foundation Model, Promptable Segmentation, Zero-Shot Transfer, Vision Transformer, Large-Scale Dataset, Interactive Segmentation
>
> <strong>Venue:</strong> IEEE/CVF International Conference on Computer Vision (<strong>ICCV 2023</strong>)
>
> <strong>Pages:</strong> 4015–4026
>
> <strong>DOI:</strong> 10.1109/ICCV51070.2023.00371

## 1. One-line Summary

<strong>SAM은 promptable segmentation, 대규모 supervised data engine, 범용 prompt interface를 통해 segmentation을 foundation-model paradigm으로 확장하려 했으며, 최고 수준의 domain-specific accuracy보다는 generalization과 composability를 우선한 모델이다.</strong>

## 2. Problem

### 2.1. Introduction of Foundation

- web-scale dataset에 사전학습을 한 LLM들은 강한 zero-shot, few-shot generalization 능력을 보여주며 발전해왔다

- <span class="notion-color-blue"><strong>Foundation models </strong></span>: generalize to <span class="notion-color-blue"><strong>tasks and data distributions</strong></span> beyond those seen during training.

> When scaled and trained with <span class="notion-color-blue"><strong>abundant text corpora </strong></span>from the web, these models’ zero and few-shot performance compares surprisingly well to fine-tuned models
>
> : 웹에서 수집한 <span class="notion-color-blue"><strong>매우 방대한 양의 텍스트 말뭉치 </strong></span>
>
> - <strong>abundant</strong> = 풍부한, 아주 많은
>
> - <strong>text corpora</strong> = 대규모 텍스트 데이터 집합
>
> fine-tuning을 하지 않아도 task를 경쟁력있게 수행한다.

최근 foundation model 트렌드는 <span class="notion-color-blue"><strong>model scale</strong></span>, <span class="notion-color-blue"><strong>dataset size</strong></span>, <span class="notion-color-blue"><strong>total training compute </strong></span>이 세가지를 개선하는 것에 집중한다

- 최근 computer vision에서도 탐색되어 왔고 예시가 text and images from web의 alignment 사례 (CLIP, ALIGN: contrastive learning)

  ![Notion image](/notion-assets/reading-note-segment-anything/3f114b84a0f280d68249f17729fb3bb8.png)

  Source: [https://arxiv.org/abs/2102.05918](https://arxiv.org/abs/2102.05918)

## 3. Method

> The model is designed and trained to <span class="notion-color-blue"><strong>be promptable</strong></span>
>
> : 모델이 특정 segmentation task 하나만 수행하도록 만든 것이 아니라, <strong>다양한 형태의 prompt를 받아 그에 맞는 mask를 생성할 수 있도록 학습되었다.</strong>
>
> - <strong>promptable = generalizable/flexible 그 자체</strong>라기보다는, <strong>generalizable하고 flexible하게 쓰이도록 만드는 인터페이스적·학습적 성질</strong>
>
> - 다양한 prompt에 조건부로 반응할 수 있다

### 3.1. Segment Anything Task

3.1.1. Task

1. 어떤 prompt (point, box, rough mask, text 등 <strong>무엇을 segment할지 알려주는 정보)</strong>가 오더라도 그 prompt에 대응하는 valid mask를 반환하라

   > The promptable segmentation task, then, is to return a valid segmentation mask given any prompt.

2. Ambiguous prompt에서도 반드시 valid mask를 내야 함

   > 이게 interactive segmentation과 다른 점. SAM의 목표는 단 하나의 정답을 맞추는 것이 아니라 ambiguity 안에서 <span class="notion-color-blue"><strong>적어도 하나의 합리적인 마스크를 출력</strong></span>하는 것
   >
   > <em>even when a prompt is ambiguous and could refer to multiple objects (e.g., recall the shirt vs. person example, and see Fig. 3), the output should be a reasonable mask for at least one of those objects</em>

3.1.2. Pre-training: prompt simulation

> our aim is to always <span class="notion-color-blue"><strong>predict a valid mask for any prompt </strong></span>even when the prompt is ambiguous.

Ground Truth Mask → Point / box / mask prompt → SAM prediction → Compare to Ground Truth

SAM은 학습 과정부터 다양한 prompt 조건을 경험하면서 <span class="notion-color-blue"><strong>이런 종류의 hint가 들어오면 어떤 mask를 내야 하는가</strong></span>를 학습

3.1.3. Zero-shot Transfer

> our pre-training task endows the model with <span class="notion-color-blue"><strong>the ability to respond appropriately to any prompt at inference time</strong></span>, and thus downstream tasks can be solved by <span class="notion-color-blue"><strong>engineering appropriate prompts.</strong></span>
>
> ⇒ downstream task를 prompt 형태로 변환해서 푼다

- SAM에서 추구하는 Task generalization :  <strong>학습 때 직접 정의되지 않은 task에도 조합을 통해 적용</strong>

- Multi-task system : 고정된 task 집합에 대해서 작동하는 모델.

> ❓ <span class="notion-color-green_background">Interactive Learning이란 무엇인가?</span>
> : 사람이 모델과 여러 번 상호작용하면서 원하는 segmentation mask를 점점 수정해가는 방식
>
> 1. 사용자가 foreground point 클릭
>
> 2. 모델이 mask 생성
>
> 3. 잘못 포함된 곳에 background point 추가
>
> 4. 모델이 mask 수정
>
> 5. 필요하면 point를 더 추가
>
> 6. 원하는 mask 완성
>
> | Interactive segmentation    | SAM의 Promptable segmentation          |
> | --------------------------- | ------------------------------------- |
> | 사람이 계속 수정                   | 어떤 prompt가 와도 바로 valid mask를 내는 것이 목표 |
> | 여러 번 interaction 후 정확한 mask | 처음부터 합리적인 mask가 중요                    |
> | 최종적으로 높은 IoU가 중요            | ambiguity가 있어도 reasonable mask면 됨     |
> | 주로 human annotation 도구      | 사람뿐 아니라 다른 모델의 component로도 사용         |
>
> > while interactive segmentation models are designed with <span class="notion-color-blue"><strong>human users in mind</strong></span>, a model trained for promptable segmentation can also be composed into a <span class="notion-color-blue"><strong>larger algorithmic system</strong></span>

---

### 3.2. Segment Anything Model

![Notion image](/notion-assets/reading-note-segment-anything/3f114b84a0f2802c951bdc1bc0386eb0.png)

Source: Original Document

SAM은 세가지 구성요소로 나뉜다. Image encoder, flexible prompt encoder, fast mask decoder

> 고정된 task-specific output을 만드는 대신, <span class="notion-color-blue"><strong>prompt를 조건으로 모델의 동작을 바꾸게 해서 하나의 pretrained model을 여러 상황에 재사용</strong></span>한다.
>
> - <strong>CLIP</strong>: prompt가 주로 <strong>semantic query</strong> 역할→ “이 이미지가 어떤 개념과 가까운가?”
>
> - <strong>SAM</strong>: prompt가 주로 <strong>target specification</strong> 역할→ “이 이미지에서 무엇을 mask로 뽑을 것인가?”
>
> ⇒ CLIP은 <strong>semantic flexibility</strong>, SAM은 <strong>segmentation target flexibility</strong>를 높였다
>
> 둘 다 <strong>prompt를 인터페이스로 만든 것</strong>

| 모듈                              | 입력                                  | 주요 처리                                 | 출력                                             |
| ------------------------------- | ----------------------------------- | ------------------------------------- | ---------------------------------------------- |
| <strong>Image Encoder</strong>  | 1024×1024 RGB image                 | MAE-pretrained ViT-H/16               | <code>256 × 64 × 64</code> image embedding     |
| <strong>Prompt Encoder</strong> | point / box / mask / text           | prompt 종류별 embedding                  | sparse prompt tokens 또는 dense prompt embedding |
| <strong>Mask Decoder</strong>   | image embedding + prompt embeddings | 2-layer Transformer + cross-attention | segmentation mask(s) + predicted IoU           |

3.2.1. Image encoder

- <strong>입력 : </strong>원본 이미지를 resize + padding해서RGB Image 1024 × 1024 × 3 형태

- <strong>모델 : </strong>기본 backbone은: MAE로 self-supervised pre-training된 ViT-H/16

  /16이므로 기본적으로 이미지가 16×16 patch 단위로 처리 SAM에서는 고해상도 입력을 위해 <span class="notion-color-blue"><strong>14×14 windowed attention </strong></span>일정 간격의 4개 global attention block 을 추가

- <strong>출력 : </strong>ViT 출력은 입력보다 spatial resolution이 16배 작다 $1024 × 1024 →/16 \;\;64 × 64$

이후 convolution으로 channel을 256으로 설정

1. ViT output

2. 1×1 Conv → 256 channels

3. 3×3 Conv → 256 channels

4. LayerNorm

- 최종 image embedding $E_I \in \mathbb{R}^{256 \times 64 \times 64}$

3.2.2. Prompt encoder

<strong>Prompt는 Sparse Prompt (Point, Box, Text) </strong>와 <strong>Dense Prompt (Mask)</strong>로 나뉜다.

> <strong>Point Prompt</strong>

<strong>입력: </strong>(x, y)+ foreground / background label

$\text{Point Embedding}=\text{Positional Encoding}(x,y)+\text{Type Embedding}$

Type embedding은 두 개를 학습

- foreground point embedding

- background point embedding

<strong>출력: </strong>256-dimensional vector

> <strong>Box Prompt</strong>

<strong>입력 :</strong> Bounding box: (x1, y1, x2, y2)를 하나의 token으로 만들지 않고 <strong>두 corner token</strong> 변환

- Top-left → positional encoding(x1,y1) : learned "top-left" embedding

- Bottom-right → positional encoding(x2,y2) : learned "bottom-right" embedding

<strong>출력 </strong>:<strong> 2 × 256-d tokens</strong>

> <strong>Text Prompt</strong>

<strong>입력 : </strong>"the dog", "a red car"와 같은 텍스트

논문에서는 <strong>CLIP text encoder</strong>를 사용해 변환한다, Text → CLIP Text Encoder → text embedding

다만 SAM 논문의 주된 실험은 point / box / mask 같은 <strong>geometric prompt</strong>에 집중

---

> Mask Prompt : Dense Prompt

Mask는 point나 box와 다르게 Point와 box는 몇 개의 token으로 표현할 수 있지만, mask는 이미지 전체에 spatial structure가 있다

<strong>입력 mask</strong>는 원 이미지의 1/4 resolution: 256 × 256

이후 convolution으로 downsampling

```plain text
Mask
 ↓
2×2 Conv, stride 2
4 channels
 ↓
GELU + LayerNorm
 ↓
2×2 Conv, stride 2
16 channels
 ↓
GELU + LayerNorm
 ↓
1×1 Conv
256 channels
```

<strong>출력:</strong> 256 × 64 × 64 (image embedding과 동일한 spatial resolution)

- 그 뒤 $E = E_{\text{image}} + E_{\text{mask}}$처럼 <strong>element-wise addition</strong>

- mask prompt가 없으면 대신 학습된 "No Mask" embedding을 image embedding 전체에 더한다.

3.2.3. Mask decoder

![Notion image](/notion-assets/reading-note-segment-anything/3f114b84a0f28047a3c8ee45aeffa0b7.png)

Source: Original Document

attention block을 두번 돌린 다음 upscaling을 하여 mask를 뽑는다

3.2.4. Resolving ambiguity

만약 출력되는 마스크가 한개인 경우 모델은 ambiguous prompt가 주어졌을대 여러개의 valid한 mask에 대해 평균을 내버리게 된다 → 이 문제를 단일 프롬프트에 대해서 애초에 출력을 여러개를 하게 한다. (whole, part, subpart)

학습 과정에서는 가장 작은 loss를 가진 마스크에 대해서만 backpropagation을 진행하고 이mask 간의 우열을 평가하기 위해서 estimated IoU와 같이 confidence score를 마스크마다 산출한다. (IoU Prediction Head)

> Loss

$L_{mask} = 20L_{focal}+L_{dice}$

- <strong>Focal loss : </strong>픽셀 단위 분류 loss 각 픽셀에 대해 foreground인지 background인지 맞히는 문제로 보고, 특히 <strong>쉽게 맞히는 픽셀보다 어려운 픽셀에 더 큰 가중치</strong>

- <strong>Dice loss:</strong> mask 전체의 <strong>겹침 정도 </strong>

  $Dice = \frac{2|P \cap G|}{|P| + |G|}$, $L_{dice}=1-Dice$

  ⇒ Focal loss는 픽셀 수준의 어려운 오류를 잡고, Dice loss는 mask 전체의 형태와 overlap을 잡는다 또한 두 loss를 그냥 동일 비중으로 더한 게 아니라 focal loss 쪽을 훨씬 크게 스케일해서 사용

## 4. Key Idea

> a new <span class="notion-color-blue"><strong>task</strong></span>, <span class="notion-color-blue"><strong>model</strong></span>, and <span class="notion-color-blue"><strong>dataset </strong></span>for image segmentation

### 4.1. What <span class="notion-color-blue">task </span>will enable zero-shot generalization?

![Notion image](/notion-assets/reading-note-segment-anything/3f114b84a0f280f297c0d8d0c096eb7b.png)

Source: Original Document - Figure 1

⇒<span class="notion-color-blue"><strong> Promptable segmentation task t</strong></span>hat is general enough to provide a powerful pre-training objective and to enable a wide range of downstream

> the goal is to return <span class="notion-color-blue"><strong>a valid segmentation mask </strong></span>given any segmentation prompt
>
> - Prompt의 경우 spatial 이나 text information을 모두 포괄하는데 대신 obejct를 식별하는 내용이어야 한다.
>
> - valid output mask
>
>   <span class="notion-color-blue">: even when a prompt is</span><span class="notion-color-blue"><strong> </strong></span><span class="notion-color-blue"><strong>ambiguous and could refer to multiple objects</strong></span><span class="notion-color-blue"><strong> </strong></span><span class="notion-color-blue">(for example, a point on a shirt may indicate either the shirt or the person wearing it), the output should be</span><span class="notion-color-blue"><strong> </strong></span><span class="notion-color-blue"><strong>a reasonable mask for at least one of those objects. </strong></span>
>
> ⇒ 사전 학습과 이후 prompt engineering을 통한 downstream segmentation task에서도 활용할 예정

### 4.2. What is the corresponding <span class="notion-color-blue">model architecture</span>?

![Notion image](/notion-assets/reading-note-segment-anything/3f114b84a0f2804398f7f19f170b5dd5.png)

Source: Original Document

![Notion image](/notion-assets/reading-note-segment-anything/3f114b84a0f280569069e4d94377450b.png)

Source: Original Document - Figure 1

![Notion image](/notion-assets/reading-note-segment-anything/3f114b84a0f280d4b60ce979e3036fc8.png)

Source: Original Document

⇒ model has to support flexible prompting and output segmentation masks in real-time when prompted to allow for interactive use

> SAM이 여러 종류의 prompt를 받아 segmentation해야 하고, 실제 사용 환경에서도 빠르고 편하게 동작해야 하므로, 모델 구조를 아무렇게나 설계할 수는 없다

1. Promptable segmentation task constraint : point, box, mask와 같은 프롬프트를 추가 입력값으로 받기 때문에 최소한 image encoder, prompt encoder, mask decoder를 가지는 구조가 되어야 한다.

2. real-use contraint : 사용자가 점을 찍거나 box를 움질일 때마다 몇 초씩 기다릴 수 없기에 무거운 image encoder를 매 prompt마다 돌리는게 아니라 한번만 계산하고 이에 대해 출력된 임베딩에 대해서 가벼운 <span class="notion-color-blue"><strong>prompt encoder + mask decoder </strong></span> 만 다시 계산하게 하여 interactive하게 활용할 수 있게 한다.

> In particular, the model must support flexible prompts, needs to compute masks in amortized real-time to allow interactive use, and must be ambiguity-aware.

> ❓ <span class="notion-color-green_background">그렇다면 이걸 영상에 적용한다면 기존의 모델들을 더 효율적으로 활용할 수 있게 되는거 아닌가?</span>
> > 그게 SAM 2이다.
>
> ![Notion image](/notion-assets/reading-note-segment-anything/3f114b84a0f2805bad9de36e4b3ebb4e.png)
>
> Source: [https://ai.meta.com/research/publications/sam-2-segment-anything-in-images-and-videos](https://ai.meta.com/research/publications/sam-2-segment-anything-in-images-and-videos/?utm_source=chatgpt.com)
>
> > Object Tracking 분야에서 잘 쓰일 것 같다

> ❓ <span class="notion-color-green_background">SAM의 point estimation을 활용한다면 anima keypoint trajectory를 알 수 있지 않을까?</span>
> - SAM에서 point prompt: 이 점이 포함된 객체를 segmentation해라
>
> - keypoint trajectory : 이 해부학적 landmark가 시간에 따라 어디로 이동했는가
>
> > 물론 프롬프트를 통해 어느 포인트가 동물의 어느 부위인가에 대해서는 알 수 있다. 그런데 이게 같은 개체에 계속 속한 다는 것을 어떻게 보장할 수 있을까?
>
> ![Notion image](/notion-assets/reading-note-segment-anything/3f114b84a0f2808cb29fff9de08af3c0.png)
>
> <strong>Identity-stable multi-animal tracking using bidirectional segmentation with object-level memory (2025)</strong>
>
> >  SAM은 주로 초기/keyframe segmentation mask를 만들기 위해 사용하고, 이후 identity 유지의 핵심은 <strong>Cutie의 object-level memory를 이용한 VOS (Video Object Segmentation)</strong>

> 연구진들이 주장하는 모델의 필수 요소

1. <span class="notion-color-blue"><strong>a powerful image encoder</strong></span> computes an image embedding

   > the same image embedding can be reused (and its cost amortized)

2. a prompt encoder <span class="notion-color-blue"><strong>embeds prompts</strong></span>

   > We focus on<span class="notion-color-blue"><strong> point, box, and mask prompts,</strong></span> and also present initial results with free-form text prompts

3. two information sources are combined in a<span class="notion-color-blue"><strong> lightweight mask decoder</strong></span> that predicts segmentation masks.

### 4.3. What <span class="notion-color-blue">data</span> can power this task and model?

⇒ To train model, the <span class="notion-color-blue"><strong>diverse, large-scale </strong></span>source of <span class="notion-color-blue"><strong>data </strong></span>

⇒ data engine을 개발했는데 efficient model이 data collection 을 보조하는 것과 새롭게 수집된 데이터를 활용해서 모델을 개선하게 하는데 활용할 수 있다.

4.3.1. Data engine

> ❓ <span class="notion-color-green_background">Data engine 구조를 활용해 animal behaviour 분야에 이미 적용한 사례가 있지 않을까?</span>
> > Data engine은 모델을 단순히 inference에 사용하는 것이 아니라, <span class="notion-color-blue"><strong>모델이 새로운 학습 데이터를 생성</strong></span><strong>하거나 </strong><span class="notion-color-blue"><strong>annotation을 보조</strong></span><strong>하고, </strong><span class="notion-color-blue"><strong>그 데이터를 다시 모델 개선</strong></span><strong>에 사용하는 반복적 데이터 확장 구조</strong>이다.
>
> > 자동 생성 label을 반복적으로 재학습하여 다시 label을 생성하는 recursive self-training을 하지 않고, human-validated data로 충분히 강한 generator를 만든 뒤 high-confidence·stable masks만 일회성으로 대규모 생성하고, 그 품질을 human evaluation과 downstream ablation으로 검증했다.
>
> [https://docs.sleap.ai/v1.5.1/overview/](https://docs.sleap.ai/v1.5.1/overview/)
>
> ![Notion image](/notion-assets/reading-note-segment-anything/3f114b84a0f280d182fae2a0171f48e6.png)
>
> Source: [https://docs.sleap.ai/v1.5.1/overview/](https://docs.sleap.ai/v1.5.1/overview/)
>
> > SLEAP이 가장 가까운 사례다
>
> 보통은 <strong>data engine</strong>으로 명시적 브랜딩을 하는게 아니라 <strong>human-in-the-loop, active learning, prediction-assisted labeling, iterative refinement</strong>라는 이름으로 구현된다고 한다.
>
> | 수준                                                     | 구조                                                                      | 대표 예시                                           | 한계                                                 |
> | ------------------------------------------------------ | ----------------------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------- |
> | <strong>1. Human-in-the-loop annotation</strong>       | Human label → Model prediction → Human correction → Retrain             | DeepLabCut, SLEAP                               | 사람이 계속 loop에 필요                                    |
> | <strong>2. Semi-automatic data engine</strong>         | 일부 자동 label + 어려운 sample만 human correction                              | Active learning, A-SOiD류                        | high-confidence prediction의 신뢰성 문제                 |
> | <strong>3. Fully/mostly automatic data engine</strong> | Raw video → automatic pose/identity/behaviour label → dataset expansion | <p class="notion-empty" aria-hidden="true"></p> | error accumulation, ID switch, behaviour ambiguity |
>
> 1. Pose estimation
>
> 2. Identity / Tracking
>
> 3. Behaviour annotation
>
> Animal behaviour analysis에서는 pose estimation을 중심으로 human-in-the-loop 기반 데이터 확장 방식이 이미 널리 사용되고 있지만, <span class="notion-color-blue"><strong>identity tracking과 temporal/social behaviour까지 포함</strong></span>하여 <span class="notion-color-blue"><strong>신뢰도 높은 annotation</strong></span>을 자동 생성하고 다시 학습에 활용하는 SAM-style scalable data engine은 상대적으로 덜 확립되어 있다.

> 새로운 데이터 분포에 대해 좋은 일반화 성능을 달성하기 위해서는 SAM을 훈련시킬 크고 다양한 마스크 셋이 필요한데 이는 기존의 segmentation dataset을 능가하는 규모가 필요했다.

![Notion image](/notion-assets/reading-note-segment-anything/3f114b84a0f2803da214c332a00aef29.png)

Source: Original Document - Figure 1

> we co-develop our model with <span class="notion-color-blue"><strong>model-in-the-loop dataset annotation</strong></span>
>
> 1. Assisted-manual : SAM assists annotators in annotating masks, <span class="notion-color-blue"><strong>similar to a classic interactive segmentation setup</strong></span>
>
> 2. Semi-automatic : SAM can automatically generate masks<span class="notion-color-blue"><strong> for a subset of objects</strong></span> by prompting it with likely object locations and <span class="notion-color-blue"><strong>annotators focus on annotating the remaining objects</strong></span>, helping increase mask diversity
>
> 3. Fully automatic : we prompt SAM with a regular grid of foreground points, yielding on average ∼100 high-quality masks per image.

4.3.2. Dataset : SA-1B

11M 개의 라이센스가 있는 이미지와 개인정보를 보호하는 이미지로부터 1B 이상의 마스크를 포함하는 데이터셋. 기존에 존재하는 sementation dataset 보다 400배 더 많은 마스크를 보유하고 있고 품질 또한 좋고 다양한 걸 확인했다 이를 통해 SAM을 강건하고 일반화 능력이 좋은 모델로 학습시킬 수 있었다.

## 5. Result

### 5.1. Experiment Design

1. <strong>새로운 23개 segmentation dataset</strong>에서 SAM을 평가

   > 학습에 직접 쓰이지 않은 다양한 데이터셋에 대해 <strong>foreground point 하나만 prompt로 줘도</strong> 사람이 만든 ground-truth mask에 꽤 가까운 품질의 segmentation mask를 생성
   >
   > ⇒ 단순한 point prompt만으로도 새로운 image distribution에 잘 일반화한다

2. SAM을 별도 fine-tuning 없이 <strong>prompt engineering만으로 여러 downstream task에 zero-shot 적용</strong>

   > edge detection, object proposal generation, instance segmentation, text-to-mask prediction,… etc.
   >
   > ⇒ 결과적으로 SAM은 원래 학습된 segmentation 문제를 넘어서, prompt를 잘 설계하면 다양한 vision task에 바로 활용될 수 있다

### 5.2. Zero-shot Transfer Experiment

5.2.1. Zero-Shot Single Point Valid Mask Evaluation

![Notion image](/notion-assets/reading-note-segment-anything/3f114b84a0f2809b96f4cb82b67da79d.png)

Source: Original Document

<strong>23개의 서로 다른 segmentation dataset에서 foreground point 하나만 주고 mask를 생성</strong>했습니다. SAM은 23개 중 16개 dataset에서 강한 interactive segmentation baseline인 RITM보다 높은 mIoU를 기록했고, dataset에 따라 최대 약 +47 IoU까지 차이가 났습니다.

특히 SAM은 ambiguous한 point 하나에 대해 3개의 mask를 만들 수 있는데, 이 중 GT와 가장 가까운 mask를 사후 선택하는 oracle setting에서는 23개 모든 dataset에서 RITM보다 높았습니다. 즉 낮은 점수가 반드시 segmentation 능력 부족 때문이라기보다, person vs shirt처럼 point 하나가 여러 valid mask를 의미하는 ambiguity 때문인 경우가 많다는 것입니다.

Human evaluation에서는 이 차이가 더 분명했습니다. SAM의 mask는 평균적으로 7~9/10 수준을 받았고, 모든 평가 dataset에서 RITM보다 높은 평가를 받았습니다. 심지어 mIoU에서는 SAM이 뒤졌던 DRAM이나 IBD에서도 사람이 봤을 때는 SAM mask가 더 좋은 것으로 평가됐습니다.

> <strong>single point라는 매우 모호한 prompt에서도 SAM은 사람이 보기에 reasonable한 valid mask를 잘 생성한다.</strong>

Point 수가 1→9개로 증가하면 기존 interactive segmentation 모델과의 격차는 줄어듭니다. 즉 SAM은 많은 point를 받아 pixel-perfect mask를 만드는 특화 interactive segmenter라기보다, <span class="notion-color-blue"><strong>적은 prompt에서도 좋은 mask를 만드는 general-purpose model</strong></span>

5.2.2. Zero-Shot Edge Detection

![Notion image](/notion-assets/reading-note-segment-anything/3f114b84a0f2807ead5dfc95739a00e2.png)

![Notion image](/notion-assets/reading-note-segment-anything/3f114b84a0f280a7b6dcf43cd165d7a1.png)

Source: Original Document

SAM은 당연히 BSDS500에 직접 학습된 SOTA보다 낮지만, <strong>zero-shot인데도 초기 supervised deep model인 HED에 상당히 가까운 수준 또한 zero-shot 모델 간에서는 가장 좋은 성능을 보여줌</strong>

5.2.3. Zero-shot Object Proposal

> 이미지 안에서 <span class="notion-color-blue"><strong>객체일 가능성</strong></span>이 있는 영역들을 가능한 많이 후보로 뽑는 과제
>
> ⇒ 특정 category를 몰라도 <strong>objectness를 어느 정도 일반화했는지</strong> 보는 테스트
>
> Average Recall을 통해 평가를 진행한다.

![Notion image](/notion-assets/reading-note-segment-anything/3f114b84a0f280a2acd5effbcf459457.png)

Source : Original Document

> LVIS annotation distribution에 직접 fitting된 detector는 frequent/small objects에 강하지만, SAM은 category에 직접 학습되지 않았는데도 rare object까지 잘 proposal한다.

⇒ SAM의 일반화 능력 확인

5.2.4. Zero-Shot Instance Segmentation

![Notion image](/notion-assets/reading-note-segment-anything/3f114b84a0f28080a484e841dc707337.png)

Source: Original Document

사람이 보기에는 instance segmentation결과가 SAM이 모델 출력값 중 합리적이었다. 그런데 점수 상으로는 supervised ViTDet가 더 좋았다. 이에 대해 저자들은 이걸 <strong>benchmark annotation bias</strong>로 해석한다.

⇒ ViTDet은 COCO/LVIS의 annotation convention까지 학습해서 AP에는 유리하지만, SAM은 그런 convention에는 맞추지 않아도 실제 mask boundary는 더 자연스러울 수 있다는 것

---

5.2.5. Zero-shot Text-to-Mask

![Notion image](https://prod-files-secure.s3.us-west-2.amazonaws.com/5cb976cf-b403-4dc0-9558-e19b6df74cee/b8af434a-6e3a-48a9-bba6-3fb8edf3f181/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4667LKRETMN%2F20261013%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20261013T134834Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjENb%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQCtPKX5CPmSTJb42M8JVmP8R%2BWzRn3gb3pe9%2BtKztCaXQIgYzz9KaWG19gENjLPfRkShuzBhHk2Mose732ogvLFbTEqiAQInv%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARAAGgw2Mzc0MjMxODM4MDUiDLY0N9YJbD%2BxcXWj1SrcA7IAB42%2FNVxz%2F%2BO5GQmVaALM1uLQX46ANNyyXvxyCrpqlMMYz0O8n5Q2N%2FYVnoJPoxLTlYx5TdHUrTaIssZTDSwUX%2FkpPWFTyKSAw7jUWeiBb%2F%2ByV95rLxwEkj4wWCUXPxlsDmAkBVw%2BXJvYs6O%2Fj9nxYQE2g%2BSfJOwi7ZoccX5PPsWzy92dVL5i0n03nlAqcgyFI3QMB4dBULUbJh0evIB63SWOUWtbj5AVvpLQwOfB2EVm6JqbxFlCMCXTjUA8VX60ldnLGeRIxe5qGPEPA2g4Fp0%2FF67dVH5%2BmstCz9193xhKEqmHL8P7YvCx7sfQShdOKMQx8Inv0PmGHJtb1lO%2FELfCQgXj2z3m%2BVSjVZ2RLcEripn1qcEmfClhP3Cbjt8SLClqkjaM6MRN4xIRT2z3gfKM%2BVhZv2QVj0XcFFxE9RPOnQxR46TT46qKP1Ad1DsmyB9wTUwWOKv6VH9Rns9%2BumKwwJQ3gI3pwz36iJfS7m5VkizuR3cFTBA9i1Q5RRkbrYZYaY29jVt%2FH7%2FHsRlCZ90qOWG0Sty1qMKXMiQFfN3WkaWXjyDwzwz5F4Rj20Ebk3koAlx97e7pLp2D6rXkslTdElFaBPelagTs7KZdM7CbO0v%2FLP4KUlSyMO7luNYGOqUBIPR8FArtTxgnQBQXVqSNG4A2kO6Zp715CyaNXN1HcHj5RkIKtcHhXEfC55JcFWZyUIPpIcO%2BDbSNDKapqyrti8yWyTIz0eWXBe1Hjk6SJ5MD2Dj0T%2B5XzYpKfu7DqTZq%2F9nT%2FTwTas3DdwSktj2DSwN8seRGd75fdK7xqtgvrSHdxWL7MxeZjedJmguCrXctGeSDznTZXW6zlr5Hj255Kj%2BFMFwz&X-Amz-Signature=cf218d1453409d8f483afcaade908af8214c5e2655d6b29527ad3553d479c4c0&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Source: Original Document

> 텍스트만으로 실패할 경우 point prompt를 추가하면 정답을 segmen할 확률이 높아졌다. 다만 정량적 benchmark라기보다는 가능성 확인 수준

---

5.2.6. Ablation Study

![Notion image](/notion-assets/reading-note-segment-anything/3f114b84a0f28050ad5fe024a9a18324.png)

Source: Original Document

<strong>Data engine stage가 증가할수록 성능이 계속 향상</strong>됐습니다. 그런데 놀랍게도 <strong>최종 fully automatic 단계에서 만들어진 mask만 가지고 학습</strong>해도 <strong>전체 manual + semi-automatic + automatic data를 사용한 경우</strong>보다 약<span class="notion-color-blue"> </span><span class="notion-color-blue"><strong>0.5 mIoU </strong></span><strong>정도만 낮다.</strong>

## 6. Limitation

>  <strong>image segmentation 자체가 computer vision 전체의 일부이므로, SAM의 foundation model 범위도 제한적</strong>

> <strong>self-supervised learning보다 supervised learning의 비중이 훨씬 크다</strong>
>
> SAM은 MAE로 초기화되지만, 실제 능력 대부분은<span class="notion-color-blue"> </span><span class="notion-color-blue"><strong>대규모 supervised segmentation </strong></span><strong>training</strong>에서

> SAM은 최고 IoU를 위한 전문 모델이 아니라,<span class="notion-color-blue"><strong> generality와 breadth of use</strong></span>를 위한 모델이다.

- 가느다란 구조나 세밀한 부분을 놓칠 수 있음

- 작은 disconnected component를 잘못 만들어낼 수 있음

- zoom-in 기반 전문 segmentation 모델보다 boundary가 덜 정교함

- 많은 point prompt를 제공하는<span class="notion-color-blue"><strong> interactive segmentation</strong></span>에서는 전문 모델보다 성능이 떨어질 수 있음

- prompt 처리 자체는 빠르지만, heavy image encoder 때문에 <span class="notion-color-blue"><strong>전체 inference가 완전한 real-time은 아님</strong></span>

- text-to-mask는 아직 exploratory하며 안정적이지 않음

  > SAM3에서는 온라인 데모로 나온걸 보면 어느정도 안정화를 한게 아닐까

- semantic segmentation이나 panoptic segmentation을 단순한 prompt만으로 구현하는 방법이 명확하지 않음

- 특정 domain에서는 domain-specific model이 SAM보다 더 좋을 수 있음

## 7. Connection to My Research

[Untitled](https://app.notion.com/p/3f014b84a0f28097afbff96a88d3fcc5#3f114b84a0f2800d98cbc00553c9e1ab)

[Untitled](https://app.notion.com/p/3f014b84a0f28097afbff96a88d3fcc5#3f114b84a0f280bda840dba307185963)

[Untitled](https://app.notion.com/p/3f014b84a0f28097afbff96a88d3fcc5#3f114b84a0f280619679d14572ec967c)

## 8. What I Can Apply

## 9. Next Step
