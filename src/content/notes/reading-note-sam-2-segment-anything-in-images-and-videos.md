---
title: "[Reading Note] SAM 2: Segment Anything in Images and Videos"
slug: "reading-note-sam-2-segment-anything-in-images-and-videos"
generated: true
status: "completed"
domain: 
  - "Image Segmentation"
summary: "SAM 2는 SAM의 promptable segmentation을 비디오로 확장해 임의 프레임의 point·box·mask prompt를 전체 영상의 masklet으로 전파하고 추가 prompt로 수정할 수 있게 한 통합 모델이다. Hiera feature와 예측 mask를 memory로 저장해 이후 프레임에 attention으로 활용하며, SAM 1과 유사한 model-in-the-loop data engine으로 SA-V를 구축했다."
type: "paper-review"
researchFields: 
  - "Video Understanding"
  - "Computer Vision"
featured: false
methods: 
  - "Promptable Video Segmentation"
  - "Video Object Segmentation"
  - "Foundation Model"
  - "Streaming Memory"
date: "2026-10-07"
paperUrl: "https://ai.meta.com/datasets/segment-anything-video/"
otherSources: 
  - "https://ai.meta.com/blog/segment-anything-2-video/"
notion: "https://app.notion.com/p/Reading-Note-SAM-2-Segment-Anything-in-Images-and-Videos-3f214b84a0f2806f8cb8e65c2b872360"
---

<!-- This file is generated from Notion. Do not edit directly. -->

## Paper Information

>
>
> <strong>Title:</strong> SAM 2: Segment Anything in Images and Videos
>
> <strong>Authors:</strong> Nikhila Ravi, Valentin Gabeur, Yuan-Ting Hu, Ronghang Hu, Chaitanya Ryali, Tengyu Ma, Haitham Khedr, Roman Rädle, Chloe Rolland, Laura Gustafson, Eric Mintun, Junting Pan, Kalyan Vasudev Alwala, Nicolas Carion, Chao-Yuan Wu, Ross Girshick, Piotr Dollár, Christoph Feichtenhofer
>
> <strong>Affiliation:</strong> Meta AI / FAIR
>
> <strong>arXiv ID:</strong> <strong>2408.00714</strong>
>
> <strong>Topic:</strong> Promptable Video Segmentation, Video Object Segmentation, Foundation Model, Streaming Memory, Interactive Segmentation, Image Segmentation
>
> <strong>Venue:</strong> arXiv, 2024
>
> <strong>Date:</strong> July 29, 2024 (Meta 공개), arXiv 제출 August 1, 2024
>
> <strong>Pages:</strong> 44 pages (main paper + appendix 기준)
>
> <strong>Project / Code:</strong> Meta Segment Anything 2
>
> <strong>Dataset:</strong> <strong>SA-V (Segment Anything Video Dataset)</strong> : 약 51,000개의 실제 영상과 600,000개 이상의 masklet을 포함한 대규모 비디오 segmentation 데이터셋.

## 1. One-line Summary

SAM 2는 SAM의 promptable segmentation을 비디오로 확장해 임의 프레임의 point·box·mask prompt를 전체 영상의 masklet으로 전파하고 추가 prompt로 수정할 수 있게 한 통합 모델이다. Hiera feature와 예측 mask를 memory로 저장해 이후 프레임에 attention으로 활용하며, SAM 1과 유사한 model-in-the-loop data engine으로 SA-V를 구축했다.

> a foundation model towards solving promptable visual segmentation in images and videos

(i) extending the promptable segmentation task to video

(ii) equipping the SAM architecture to use memory when applied to video

(iii) the diverse SA-V dataset for training and benchmarking video segmentation.

## 2. Problem

AR, VR, robotics, 자율주행, 영상 편집등에서는 static한 image-level segmentation이 아니라 그 이상의 temporal localization을 요구하게 된다.

영상 속 segmentation은 특히 the spatio-temporal extent of entities에 집중한다.

- the spatio-temporal extent of entities : 영상 속 <span class="notion-color-blue"><strong>어떤 객체(entity)</strong></span>가 <span class="notion-color-blue"><strong>공간적으로 어디에 있고</strong></span>, <span class="notion-color-blue"><strong>시간적으로 언제부터 언제까지 존재</strong></span>하는지의 범위

- 영상에서는 motion, deformation, occlusion, lighting changes와 같은 요소들로 인해appearance 측면에서 분명한 차이를 겪는다.

- camera motion, blur, lower resolution등으로 인해 영상은 종종 사진보다 더 낮은 퀄리디를 보이고 게다가 대향의 프레임에 대해서 효율적으로 처리를 하는 것이 주요 과제다.

> SAM 2에서는 Promptable Visual Segmentation (PVS) task에 집중하는데 이 과제는 영상 도메인에서 image segmentation을 일반화하는 과제라고 한다.
>
> - 비디오의 임의의 프레임에 점(point), 박스(box), 또는 마스크(mask)를 입력으로 받아 관심 있는 객체 영역을 지정
>
> - 모델은 해당 객체에 대해 비디오 전체에서의 시공간 마스크, 즉 <strong>masklet</strong>을 예측
>
> - 한 번 masklet이 생성된 뒤에는 다른 프레임에 추가적인 프롬프트를 제공하여 그 결과를 반복적으로 수정하고 개선 가능
>
>   - <strong>다른 프레임에서 다시 힌트를 줄 수 있다 (</strong>iteratively refined)
>
> $\text{masklet} = \{M_t\}_{t \in T}$ : 하나의 객체에 대해 시간축을 따라 이어지는 mask 집합

### 2.1. Related work

2.1.1. Image segmentation

SAM에서 promptable image segmentation task를 소개했는데 이건 관심 대상에 대한 bbox, point가 pormpt로 주어지면 이에 대해 유효한 segmentation mask를 출력하는 것이 목표

| 항목     | Original SAM                                               |
| ------ | ---------------------------------------------------------- |
| Input  | <strong>Image + prompt</strong>                            |
| Prompt | point, box, coarse mask                                    |
| Output | prompt가 가리키는 객체의 <strong>binary segmentation mask</strong> |
| 데이터    | <strong>SA-1B</strong>: 약 11M images, 1B+ masks            |
| 핵심 구조  | Image Encoder(ViT) + Prompt Encoder + Mask Decoder         |
| 목표     | 새로운 객체/도메인에도 prompt만 주면 zero-shot segmentation             |
| 핵심 한계  | 세밀한 경계, 계산량, domain shift, video temporal consistency      |

> SAM 이후의 image segmentation 관련 연구들

- 더 세밀한 마스크에 학습하기 위한 High-Quality output token 도입

- SAM efficiency 개선

- mdeical imaging remote sensing, motion segmentation, camouflaged object dectection과 같은 분야 적용

| 연구                                              | 도입 개념                                                                                     | 의의                                                                                                                                                                 |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| <strong>HQ-SAM — Ke et al., 2024</strong>       | 기존 SAM에 <strong>High-Quality Output Token</strong>을 추가하고, 경계와 세부 구조가 정교하게 라벨링된 mask로 학습   | SAM이 대략적인 객체 영역은 잘 잡지만 <strong>얇은 구조, 세밀한 경계, 작은 디테일</strong>에서 떨어지는 문제를 보완. 즉 <strong>“segment anything” → “segment anything more precisely”</strong>에 가까운 연구입니다. |
| <strong>EfficientSAM — Xiong et al.</strong>    | SAM의 무거운 ViT encoder 대신 더 작은 encoder를 사용하고, masked-image pretraining을 활용                  | SAM의 큰 계산량을 줄이면서 segmentation 능력을 최대한 유지하려는 접근. <strong>edge/mobile 환경에서 SAM을 사용할 가능성</strong>을 키웠습니다.                                                             |
| <strong>MobileSAM — Zhang et al., 2023</strong> | SAM의 큰 image encoder를 <strong>knowledge distillation</strong>으로 작은 encoder로 교체            | SAM의 prompt encoder와 mask decoder는 유지하면서 병목인 image encoder를 작게 만들어 <strong>모바일·실시간 활용 가능성</strong>을 높였습니다.                                                         |
| <strong>FastSAM — Zhao et al., 2023</strong>    | SAM 자체를 단순 축소하기보다는 <strong>YOLO 계열 segmentation 구조</strong>로 빠른 “segment anything” 기능을 구현 | 범용 promptable segmentation이라는 SAM의 목적은 유지하면서 <strong>속도를 대폭 높이는 대안적 구조</strong>를 제시했습니다. 즉 SAM architecture 자체가 반드시 필요한지에 대한 실용적 대안입니다.                            |

| Method                        | SAM에서 무엇을 유지?                 | 무엇을 변경?                                     | 추가 데이터/학습                      | 해결하려는 문제                   |
| ----------------------------- | ----------------------------- | ------------------------------------------- | ------------------------------ | -------------------------- |
| <strong>SAM</strong>          | -                             | -                                           | SA-1B: 11M images, 1B+ masks   | 범용 promptable segmentation |
| <strong>HQ-SAM</strong>       | SAM backbone 대부분              | HQ token + feature fusion                   | 44K fine masks                 | 세밀한 boundary               |
| <strong>MobileSAM</strong>    | Prompt encoder + mask decoder | ViT-H → TinyViT                             | Distillation                   | 계산량                        |
| <strong>EfficientSAM</strong> | SAM task/interface            | lightweight encoder + SAMI pretraining      | SA-1B fine-tuning              | 계산량 + representation       |
| <strong>FastSAM</strong>      | promptable task 개념            | architecture 자체를 instance segmentation으로 변경 | SA-1B 일부                       | 속도                         |
| <strong>MedSAM</strong>       | SAM 기본 구조                     | medical adaptation + prompt 제한              | 1.57M medical image-mask pairs | domain shift               |

![Notion image](/notion-assets/reading-note-sam-2-segment-anything-in-images-and-videos/3f814b84a0f2806195ddfb36bf9ba68f.png)

Source: Diagram generated by ChatGPT

> 기존의 연구를 개선하기 위해서는 1. 모델이 성능을 보이지 못했던 부분에 대해 특화된 개선을 하거나, 2. component를 대체하거나, 3. domain에 적용하는 등의 접근이 필요하다

2.1.2. Interactive Video Object Segmentation (iVOS)

> 사용자가 영상의 일부 프레임에서 점, 박스, scribble, mask 같은 힌트를 주면, 모델이 관심 객체를 영상 전체에서 분할하고, 필요하면 추가 힌트로 결과를 수정하는 task

이전 연구 흐름

1. <span class="notion-color-blue"><strong>graph-based optimization</strong></span> to guide the segmentation annotation process

2. adopt a <span class="notion-color-blue"><strong>modular design</strong></span>, converting user inputs into a <span class="notion-color-blue"><strong>mask representation </strong></span>on a single frame and then propagating it to other frames.

> click이 손수 라벨링하는 것보다 훨씬 쉬운 interactive video segmentation 데이터 수집 방식이기에 이를 활용해서 mask나 point에 기반한 video tracker를 활ㅇ용해 SAM의 활용을 연구하는 분야도 있다
>
> ⇒ 하지만 이 분야는 아래의 한계점이 있었다.
>
> 1. Image에서 잘 작동한다고 해서 SAM이 영상 프레임에 바로 잘 활용되지는 못했다.
>
> 2. 또한 모델의 실수를 교정하는 방식에 대해 정립되지 않았는데 그때 당시에는 SAM을 활용해서 각 프레임에 대해 다시 annotation을 하거나 다시 tracking을 시작하는 방법이 있었다.

2.1.3. Video Object Segmentation (VOS)

> VOS 과제의 경우 object mask를 첫 프레임에서 입력값으로 주어지는데 이는 반드시 영상 전체에서 정확하게 tracking 되어야 했다.
>
> semi-supervised VOS라고도 불렸는데 input mask가 어찌보면 첫 프레임에서만 발견가능한 객체에 대해서 supervision signal을 준 것이라고도 볼 수 있었기 때문이다.

이전의 DL 기반의 접근은 주로 <span class="notion-color-blue"><strong>첫 프레임의 annotated mask를 이용해 test-time에 해당 target object에 모델을 fine-tuning한다</strong></span>는 흐름이었는데 target obejct에 모델을 적응시키기 위한 방법이었다

- 장점은 특정 target에 매우 잘 적응할 수 있다는 것이지만, inference 시 학습이 필요하기 때문에 <strong>매우 느리다</strong>는 단점이 있었다.

이후에는 <span class="notion-color-blue"><strong>offline-trained model</strong></span>이 빠른 성능을 보였는데 이 방식에서는 inference 때 새로 fine-tuning하지 않고, 훈련 단계에서 이미 <span class="notion-color-blue"><strong>reference mask + current frame  ⇒ current mask</strong></span>관계를 학습한다. 첫 프레임의 reference mask나 이전 프레임의 예측 결과를 <span class="notion-color-blue"><strong>conditioning information</strong></span>으로 활용하여 현재 프레임의 mask를 예측하였다.

그 뒤에는 multi-conditioning이 제시되었는데 이는 RNN과 transformer를 활용해서 여러 과거 프레임의 feature와 object mask 정보를 <span class="notion-color-blue"><strong>memory/temporal representation으로 축적</strong></span>하고, 현재 프레임 segmentation을 여러<span class="notion-color-blue"><strong> reference frame에 conditioning</strong></span>하도록 발전하였다.

이러한 Semi-supervised VOS는 일종의 Promptable VIsual Segmentation (PVS) task의 특이 사례로 보여질 수 있는데 첫 프레임에 대해 mask prompt가 주어지는 것으로 해석 가능하기 때문이다

prompt가 <span class="notion-color-blue"><strong>반드시 첫 프레임</strong></span>에 있고, 형태가 <span class="notion-color-blue"><strong>high-quality mask</strong></span>이며 이후에는 보통 추가 interaction이 없기 때문

주목할만한 점은 VOS에서 첫 프레임에 대해 high-quality object mask를 annotate하는 것은 실제로는 어렵고 추론에서 시간을 많이 잡아먹었다고 한다.

>
>
> segmentation annotation을 줄이기 위해 VOS를 사용하는데 VOS를 시작하려면 먼저 고품질 segmentation annotation이 필요하다.

2.1.4. Video segmentation datasets

이전에도 VOS task를 지원하기 위해 많은 데이터셋이 제시되었다.

- DAVIS와 같은 초기 VOS dataset은 고품질 annotation을 포함하지만 deep-learning 기반 접근을 하기에는 규모가 제한적이었다.

- YouTube-VOS의 경우 첫 VOS 대규모 데이터셋이었다

- 알고리즘이 나아지고 벤치마크 성능이 성숙해짐에 따라 VOS task의 난도를 올리고 task specific한 방향으로 접근이 되었다.

  - occlusion, long videos, extreme transformation, object diversity, scene diversity

    - Occlusion : 타겟 객체가 다른 객체나 배경 구조물에 의해 <strong>일시적으로 가려졌다가 다시 나타날 때(Re-appearance) 객체의 정확한 픽셀 마스크를 유지하고 추적하는 기술</strong>

> Segment Anything을 하기에는 기존의 데이터셋은 특정 객체에 대한 것이 많았고 객체 전체에 대해 커버 (부분적인 마스크 지원 X)한다는 한계점이 있었다.

## 3. Method

### 3.1. Task : Promptable Visual Segmentation

![Notion image](/notion-assets/reading-note-sam-2-segment-anything-in-images-and-videos/3f814b84a0f280e3b65eea309beb5f9f.png)

Prompt는 positive/negative click, bounding box, mask 등의 형태로 주어질 수 있으며, 사용자는 이를 통해 <strong>어떤 객체를 segment할 것인지 지정하거나 기존 model prediction의 오류를 수정</strong>할 수 있다.

특정 프레임에 prompt가 주어지면, interactive experience를 위해 모델은 우선 <strong>해당 프레임에서 prompt와 일치하는 유효한 object segmentation mask를 즉시 출력</strong>해야 한다.

![Notion image](/notion-assets/reading-note-sam-2-segment-anything-in-images-and-videos/3f814b84a0f280a1886fe4e288f3e1eb.png)

Source: Original Document

하나 이상의 프레임에 prompt가 주어진 이후에는, 모델이 이러한 prompt들을 조건으로 삼아 <strong>동일한 객체를 비디오 전체에서 localize하고 각 프레임의 segmentation mask를 예측해야 한다.</strong> 이 시간적으로 연결된 object mask sequence를 <strong>masklet</strong>이라고 한다.

이후에도 사용자는 비디오의 임의의 프레임에 추가 prompt를 제공할 수 있으며, 모델은 새 정보를 반영하여 <span class="notion-color-blue"><strong>전체 비디오에 걸친 masklet을 반복적으로 수정(refine)</strong></span>해야 한다.

### 3.2. Model : Segment Anything Model 2

A <span class="notion-color-blue"><strong>promptable and</strong></span> <span class="notion-color-blue"><strong>light-weight mask decoder </strong></span>takes an <span class="notion-color-blue"><strong>image embedding and prompts</strong></span> (if any) and outputs a segmentation mask for the frame. Prompts can be iteratively added on a frame in order to refine the masks.

> 모델은 기존의 SAM에서 가장 큰 차이점이 temporal information을 담기 위한 memory attention 모듈을 추가했다는 점이다.

![Notion image](/notion-assets/reading-note-sam-2-segment-anything-in-images-and-videos/3f814b84a0f280b7815fc1a32787b1fb.png)

Source: Segment Anything, [https://arxiv.org/abs/2304.02643](https://arxiv.org/abs/2304.02643)

기존 SAM에서는 Image encoder 출력물을 바로 mask decoder에 conv layer를 통해서 변환 뒤에 넘겨준다.

![Notion image](/notion-assets/reading-note-sam-2-segment-anything-in-images-and-videos/3f814b84a0f28086bd0ecabbc6355c7e.png)

Source: Original Document

하지만 SAM 2 decoder에서 활용되는 프레임 임베딩은 image dncoder로부터 바로 출력되는게 아니라 과거 prediction과 prompted frames에 기반하여 <span class="notion-color-blue"><strong>conditioned on memories</strong></span>가 된다.

⇒ 그래서 시간의 방향이 양방으로 가능했다 (현재 프레임 기준으로 해서 미래의 프레임으로부터 prompted frames가 오는 것도 가능했다.)

프레임에 대한 memories는 현재 예측에 기반한 memory encoder에 의해 생성되면서 memory bank에 저장이 된다.

> ❓ <span class="notion-color-green_background">Hiera feature란 무엇인가?</span>
> ![Notion image](/notion-assets/reading-note-sam-2-segment-anything-in-images-and-videos/3f814b84a0f2809087e7c4478abd1dd7.png)
>
> Source: Hiera: A Hierarchical Vision Transformer without the Bells-and-Whistles, [https://arxiv.org/pdf/2306.00989](https://arxiv.org/pdf/2306.00989)
>
> 말 그대로 hierarchical architecture.
>
> 일반적인 ViT는 이미지를 <span class="notion-color-blue"><strong>일정 크기 patch</strong></span>로 나눈 뒤 <span class="notion-color-blue"><strong>거의 같은 해상도의 token sequence를 끝까지 유지</strong></span>하는 편인데, Hiera는 CNN처럼 stage가 진행될수록 <span class="notion-color-blue"><strong>spatial resolution을 줄이고 feature hierarchy를 만든다</strong></span>
>
> 관심 있다면 같이 보면 좋은 블로그 글 : [https://kimjy99.github.io/논문리뷰/hiera/](https://kimjy99.github.io/%EB%85%BC%EB%AC%B8%EB%A6%AC%EB%B7%B0/hiera/)

![Notion image](/notion-assets/reading-note-sam-2-segment-anything-in-images-and-videos/3f814b84a0f280ed834bdefa74d38f4c.png)

Source: Original Document

> memory encoder가 <strong>새로운 image encoder를 하나 더 쓰지 않는다</strong>
>
> ⇒ 현재 프레임에서 이미 만든 image embedding을 재사용하고 여기에 현재 predicted mask 정보를 결합해서 “이 프레임에서 target object가 어떻게 보였는가”를 표현하는 memory feature로 memory encoder를 구성한다.
>
> 현재 frame의 Image embedding이 <span class="notion-color-blue"><strong>query</strong></span>가 되고 memory bank에 저장된 과거 memory들이 <span class="notion-color-blue"><strong>key/value (attention 형태)</strong></span>로 저장된다

Memory bank 자체는 RNN이나 별도의 Transformer backbone이 아니라, 과거 프레임에서 생성된 <span class="notion-color-blue"><strong>spatial memory feature와 object pointer token</strong></span>을 저장하는 <span class="notion-color-blue"><strong>token-based memory storage</strong></span>다. 그리고 현재 프레임은 Transformer의 cross-attention을 통해 이 memory bank를 조회한다.

> ❓ <span class="notion-color-green_background">실제로 어떻게 memory를 저장하고 불러오는가?</span>
> memory attention에서는 Tensor의 형태로 memory를 입력받고 그에 대해서 attention의 Q K V 구조로 해당 임베딩이 출력되는 구조인 것 같다
>
> ![Notion image](/notion-assets/reading-note-sam-2-segment-anything-in-images-and-videos/3f814b84a0f2801a9236ec81a52b5fa7.png)
>
> 그럼 이 텐서는 어디서 왔을까 아래 코드는 SAM2&#95;base 코드인데 새롭게 memory를 encode하는 과정을 보면 maskmem&#95;out이라는 것으로 feature를 불러오고 새롭게 ㅈ
>
> ![Notion image](/notion-assets/reading-note-sam-2-segment-anything-in-images-and-videos/3f814b84a0f2805c9e8fda0bf9a76ca9.png)
>
> current&#95;out으로 명시된 python dictionary에 저장되는 것을 볼 수 있다.
>
> ```shell
> current_out = {
>     "pred_masks": ...,
>     "pred_masks_high_res": ...,
>
>     "obj_ptr": Tensor(...),
>
>     "maskmem_features": Tensor(...),
>     "maskmem_pos_enc": [...]
> }
> ```
>
> ⇒  이후 <code>current&#95;out</code>들이 상위 코드에서 <strong>프레임 번호를 key로 해서 </strong><strong><code>output&#95;dict</code></strong><strong>에 보관 나중에 </strong><strong><code>memory = torch.cat(to&#95;cat&#95;memory, dim=0)</code></strong><strong> 이런 식으로 하나로 합쳐져 긴 Tensor가 되고 이에 대해서 attention query를 진행하는 방식</strong>
>
> > SAM 2는 frame number를 이용해 어떤 <span class="notion-color-blue"><strong>memory tensors를 후보군</strong></span>으로 불러올지 먼저 선택하고, 실제 attention에서는 그 <span class="notion-color-blue"><strong>tensor 내부의 feature token</strong></span>들을 Key/Value로 사용하여 현재 frame의 Query와 feature similarity를 계산합니다.
>
> ![Notion image](/notion-assets/reading-note-sam-2-segment-anything-in-images-and-videos/3f814b84a0f28047a85ecff72be4e257.png)
>
> 이 memory bank는 실제 사용자가 inference를 진행하면서 동적으로 생성 및 관리된다.
>
> ![Notion image](/notion-assets/reading-note-sam-2-segment-anything-in-images-and-videos/3f814b84a0f28081a366e30e834bd879.png)

### 3.3. Data : Data Engine and Dataset

> Our final Segment Anything Video (SA-V) dataset consists of<strong> </strong><span class="notion-color-blue"><strong>35.5M masks </strong></span>across <span class="notion-color-blue"><strong>50.9K videos</strong></span>, <span class="notion-color-blue"><strong>53× more masks </strong></span>than any existing video segmentation dataset.

기존의 SAM에서 활용되었던 data engine과 데이터셋 생성 구조와 비슷하다

| Phase                    | 사용 모델            | Annotator 역할                                     | 결과                             |
| ------------------------ | ---------------- | ------------------------------------------------ | ------------------------------ |
| <strong>Phase 1</strong> | SAM only         | 모든 프레임을 직접 segmentation                          | 느리지만 고품질 기준 데이터                |
| <strong>Phase 2</strong> | SAM + SAM 2 Mask | 첫 프레임 mask 생성 → propagation → 틀린 프레임은 다시 mask 수정 | annotation 속도 크게 향상            |
| <strong>Phase 3</strong> | Full SAM 2       | 초기 prompt + 필요할 때 click으로 correction             | 가장 효율적인 interactive annotation |

![Notion image](/notion-assets/reading-note-sam-2-segment-anything-in-images-and-videos/3f814b84a0f280fe80b2d0b8001069fe.png)

Source: Original Document

> SAM 2의 data engine은 SAM 1과 동일하게 <span class="notion-color-blue"><strong>model-in-the-loop 방식</strong></span>으로 모델 개선과 데이터 수집을 반복하지만, <span class="notion-color-blue"><strong>이미지 단위 mask 생성에서 더 나아가 temporal mask propagation과 interactive correction을 단계적으로 도입</strong></span>하여 <span class="notion-color-blue"><strong>video masklet annotation 비용을 줄이고 SA-V를 확장</strong></span>하였다.

![Notion image](/notion-assets/reading-note-sam-2-segment-anything-in-images-and-videos/3f814b84a0f280c98300efb1f7cb810b.png)

Source: Original Document

## 4. Key Idea

> SAM 2 is equipped with a <span class="notion-color-blue"><strong>memory </strong></span>that stores information about the <span class="notion-color-blue"><strong>object and previous interactions</strong></span>, which allows it to generate<span class="notion-color-blue"><strong> masklet predictions</strong></span> throughout the video, and also effectively correct these based on the<span class="notion-color-blue"><strong> stored memory context</strong></span> of the object from previously observed frames.
>
> - 이전 모델인 SAM을 영상 도메인에 확장하는데 영상 프레임을 한번에 memory attention 모듈을 활용해서 한번에 처리한다.
>
> - 메모리가 비면 SAM과 같이 이미지 처리에 활용할 수 있다.

![Notion image](/notion-assets/reading-note-sam-2-segment-anything-in-images-and-videos/3f814b84a0f280369cf8e89bddf313e3.png)

![Notion image](/notion-assets/reading-note-sam-2-segment-anything-in-images-and-videos/3f814b84a0f2808ba333f24c50d1e691.png)

Source: Original Document

## 5. Result

### 5.1. Zero-shot experiments

> SAM 2는 interactive video segmentation에서 기존 SAM+tracker 조합보다 적은 interaction으로 더 높은 성능을 보였고, conventional VOS에서도 전문 tracker보다 우수했으며, image segmentation에서는 기존 SAM보다 빠르면서도 더 높은 정확도를 유지했다.

이 실험 결과에서는 <em><strong>J &amp; F</strong></em><em> </em>metric를 활용했다

> ❓ <span class="notion-color-green_background"><em><strong>J &amp; F</strong></em></span><span class="notion-color-green_background"><em> </em></span><span class="notion-color-green_background">metric은 어떤 지표인가?</span>
> VOS(Video Object Segmentation)에서 자주 쓰는 표준 평가 지표로, <strong>영역 정확도 </strong>$J$ 와 <strong>경계 정확도 </strong>$F$ 를 평균한 지표
>
> $\text{J\&F} = \frac{J + F}{2}$
>
> $J$: <strong>Jaccard Index</strong> (Intersection over Union, IoU) <br />⇒ 예측 mask가 GT mask의 <strong>전체 영역을 얼마나 잘 겹쳐 맞췄는지</strong>
>
> $F$: Boundary F-measure<br />⇒ pixel 전체가 아니라 <span class="notion-color-blue"><strong>boundary pixel</strong></span>이 얼마나 가까이 맞았는지

5.1.1. <strong>Promptable Video Segmentation</strong>

> SAM + tracker라는 기존 modular 설계보다, <span class="notion-color-blue"><strong>prompt 이해와 temporal propagation을 하나의 모델로 통합한 SAM 2</strong></span>가 interactive refinement에서 더 효율적이다.

![Notion image](/notion-assets/reading-note-sam-2-segment-anything-in-images-and-videos/3f814b84a0f280b69aa4e435a107b9f6.png)

source: Original Document

XMem++와 Cutie 는 당시 VOS에서 SOTA 모델이다

1. XMem++  [https://max810.github.io/xmem2-project-page/](https://max810.github.io/xmem2-project-page/)

   ![Notion image](/notion-assets/reading-note-sam-2-segment-anything-in-images-and-videos/3f814b84a0f280419c19e17f8e8d342e.png)

   Source: <strong>XMem++: Production-level Video Segmentation From Few Annotated Frames,</strong> [https://max810.github.io/xmem2-project-page/](https://max810.github.io/xmem2-project-page/)

   > 과거 프레임의 정보를 여러 종류의 memory에 저장해두고, 현재 프레임의 feature와 <strong>pixel-level matching</strong>을 해서 target object를 찾는 방식입니다. 원래 XMem은 인간 기억 모델에서 영감을 받아 <strong>sensory memory, working memory, long-term memory</strong>를 두고, 긴 영상에서도 memory가 무한히 커지지 않도록 중요한 정보를 장기 memory로 압축·유지

2. Cutie

   ![Notion image](/notion-assets/reading-note-sam-2-segment-anything-in-images-and-videos/3f814b84a0f28059bdd0e7b45c8cbec2.png)

   Source: <strong>Putting the Object Back into Video Object Segmentation, </strong>[https://arxiv.org/abs/2310.12982](https://arxiv.org/abs/2310.12982)

   > pixel-level matching의 약점을 지적하는데 비슷하게 생긴 distractor가 많으면 pixel끼리만 비교해서는 <span class="notion-color-blue"><strong>target identity</strong></span>가 헷갈릴 수 있다는 것
   >
   > ⇒  Cutie는 <span class="notion-color-blue"><strong>object-level representation</strong></span>을 추가합니다. 작은 수의 <strong>object queries</strong>가 target object 전체를 요약하고, 이 object query가 pixel-level feature와 반복적으로 상호작용 ⇒ <span class="notion-color-blue"> </span><span class="notion-color-blue"><strong>query-based object transformer</strong></span>
   >
   > ![Notion image](/notion-assets/reading-note-sam-2-segment-anything-in-images-and-videos/3f814b84a0f280e180f5d5fdc0639ebe.png)

   | <p class="notion-empty" aria-hidden="true"></p> | XMem++                               | Cutie                                              |
   | ----------------------------------------------- | ------------------------------------ | -------------------------------------------------- |
   | 핵심 아이디어                                         | 여러 종류의 <strong>pixel memory</strong> | pixel memory + <strong>object-level query</strong> |
   | Memory matching                                 | pixel ↔ pixel                        | pixel matching + object-level reasoning            |
   | 강점                                              | 긴 영상, 여러 annotated frame             | distractor/occlusion이 많은 복잡한 장면                    |
   | 특징                                              | permanent/working/long-term memory   | query-based object transformer                     |
   | 해결하려는 문제                                        | memory 효율과 annotation 비용             | pixel matching noise와 object confusion             |

5.1.2.  <strong>Semi-supervised VOS</strong>

> SAM 2가 interactive setting에서만 강한 게 아니라, <span class="notion-color-blue"><strong>기존의 고전적인 VOS protocol</strong></span>에서도 전문 tracker들을 이긴다.

![Notion image](/notion-assets/reading-note-sam-2-segment-anything-in-images-and-videos/3f814b84a0f28082b57aee7463b3fba8.png)

Source: Original Document

5.1.3. Image Segmentation

> SAM 2가 video 기능을 넣으면서 원래 SAM의 image segmentation 성능을 희생했는가
>
> ⇒ video capability를 추가했는데도 image segmentation 성능이 떨어지지 않았고, 오히려 개선되었다.

![Notion image](/notion-assets/reading-note-sam-2-segment-anything-in-images-and-videos/3f814b84a0f2801da84ee82859af9654.png)

Source: Original Document

---

### 5.2. Comparison to state-of-the-art in semi-supervised VOS

![Notion image](/notion-assets/reading-note-sam-2-segment-anything-in-images-and-videos/3f814b84a0f280fc9721de9d0377fae6.png)

Source: Original Document

> ❓ $\mathcal{G}$<span class="notion-color-green_background"><strong>는 어떤 지표인가?</strong></span>
> <strong>: YouTube-VOS의 region-and-contour score</strong>, 즉 <strong>seen/unseen category 성능을 함께 반영한 최종 VOS 지표</strong>
>
> > YouTube-VOS에서는 객체 category를 두 그룹으로 나눈다.
>
> - <strong>Seen categories</strong>: training set에서 본 category
>
> - <strong>Unseen categories</strong>: training set에서 보지 못한 category
>
> 각 그룹에서 다시 $J$와 $F$를 계산 $J_s,\quad F_s,\quad J_u,\quad F_u$
>
> - $J_s$: seen category의 region IoU
>
> - $F_s$: seen category의 boundary F-measure
>
> - $J_u$: unseen category의 region IoU
>
> - $F_u$: unseen category의 boundary F-measure
>
> 그리고 최종 $\mathcal{G}$는 이 네 값을 평균한다.
>
> $\boxed{\mathcal{G}=\frac{J_s + F_s + J_u + F_u}{4}}$
>
> > <strong>학습 때 본 객체와 처음 보는 객체 모두에 대해 영역과 경계를 얼마나 잘 segmentation하는지를 종합적으로 평가</strong>

## 6. Limitation

1. <strong>identity를 제대로 해결한 모델은 아니다</strong>

   > The model may fail to segment objects across shot changes and can lose track of or confuse objects in crowded scenes, after long occlusions or in extended videos.

2. <strong>섬세한 segmentation에 대해서는 여전히 어려움을 겪는다</strong>

   > SAM 2 also struggles with accurately <span class="notion-color-blue"><strong>tracking objects with very thin or fine details </strong></span>especially when they are fast-moving

3. <strong>multi-object interaction을 거의 모델링하지 않는다</strong>

   > While SAM 2 can track <span class="notion-color-blue"><strong>multiple objects in a video simultaneously</strong></span>, SAM 2 processes each object separately, utilizing only shared per-frame embeddings<span class="notion-color-blue"><strong> without inter-object communication</strong></span>

4. 여전히 human annotation에 의존적이다

   > Our data engine relies on <span class="notion-color-blue"><strong>human annotators to verify masklet quality </strong></span>and select frames that require correction. Future developments could include automating this process to enhance efficiency.

5. <strong>long-term understanding과는 거리가 멀다. 그렇기에 </strong>memory가 있다고 해서 video semantics를 이해하는 것은 아니다.

   SAM 2의 memory는 대체로 “이 object가 과거에 어떤 visual/spatial feature를 가졌는가?” 를 유지하는 장치이지 “이 객체가 3분 전에 무엇을 했고 다른 객체와 어떤 관계였는가?”를 이해하지는 않는다.
