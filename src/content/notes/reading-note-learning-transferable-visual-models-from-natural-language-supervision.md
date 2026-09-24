---
title: "[Reading Note] Learning Transferable Visual Models From Natural Language Supervision"
slug: "reading-note-learning-transferable-visual-models-from-natural-language-supervision"
generated: true
status: "idea"
domain:
  - "Vision-Language Learning"
type: "paper-review"
researchFields:
  - "Computer Vision"
featured: false
methods:
  - "Contrastive Learning"
  - "Multimodal"
  - "Zero-Shot Learning"
  - "Transfer Learning"
date: "2026-09-01"
readTime: 10
paperUrl: "https://icml.cc/virtual/2021/oral/9194"
otherSources:
  - "https://www.youtube.com/watch?v=b543xivGRnI"
  - "https://www.youtube.com/watch?v=T9XSU0pKX2E"
notion: "https://app.notion.com/p/Reading-Note-Learning-Transferable-Visual-Models-From-Natural-Language-Supervision-3ce14b84a0f280a3953fd5b3bcfd7b08"
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

> **Title:** Learning Transferable Visual Models From Natural Language Supervision
>
> **Authors:** Alec Radford, Jong Wook Kim, Chris Hallacy, Aditya Ramesh, Gabriel Goh, Sandhini Agarwal, Girish Sastry, Amanda Askell, Pamela Mishkin, Jack Clark, Gretchen Krueger, Ilya Sutskever
>
>
> **Affiliation:** OpenAI
>
>
> **arXiv ID:** 2103.00020
>
>
> **Topic:** Vision-Language Learning, Contrastive Learning, Multimodal Learning, Zero-Shot Learning, Transfer Learning
>
>
> **Venue:** ICML 2021 (Proceedings of the 38th International Conference on Machine Learning, PMLR Vol. 139)
>
>
> **Pages:** 8748–8763
>
>

## 1. One-line Summary


CLIP은 **대규모 image-text pair를 contrastive learning으로 학습해, 자연어를 통해 새로운 visual concept를 zero-shot으로 인식할 수 있게 만든 vision-language model**입니다.


## 2. Problem

> State-of-the-art computer vision systems are trained to predict a **fixed set of predetermined object categories**. This restricted form of supervision limits their generality and usability since additional labeled data is needed to specify any other visual concept.

기존 vision model은 ImageNet처럼 **미리 정해진 class label**을 예측하도록 학습됩니다. 그래서 새로운 개념이나 task가 생기면 다시 labeled dataset을 만들고 fine-tuning해야 합니다.


CLIP은 이 문제를


**“class label 대신 자연어 자체를 supervision으로 쓰자”**


라는 방향으로 해결합니다.


## 3. Method


CLIP은 약 4억 개의 image-text pair를 사용합니다.

- Image Encoder: ResNet 또는 ViT
- Text Encoder: Transformer
- 목표: 실제로 짝이 맞는 image-text embedding은 가깝게, 틀린 pair는 멀게 학습

즉 caption을 직접 생성하는 것이 아니라,


Which text matches this image?를 맞히는 contrastive task를 사용합니다.


## 4. Key Idea


![Notion image](/notion-assets/reading-note-learning-transferable-visual-models-from-natural-language-supervision/3d614b84a0f2805d802aef4535530729.png)


![Notion image](/notion-assets/reading-note-learning-transferable-visual-models-from-natural-language-supervision/3d614b84a0f2801d8b98f9956468f2a7.png)


Source: Original Document


`l2_normalize` : **이미지 encoder와 텍스트 encoder가 처음에는 서로 다른 형태의 feature를 만들기 때문에, 둘을 직접 비교할 수 없어서 같은 좌표계로 옮기는 과정 (차원이 다르므로 먼저 둘 다 W가 표현가능한 차원으로 옮긴다.)**


> 💡 scaled pairwise cosine similarities 구하는 과정
> > Cosine Similarity는 두 벡터가 **방향상 얼마나 비슷한지**를 측정
>
> $\text{cosine similarity}(a,b)=\frac{a\cdot b}{\|a\|\|b\|}$
>
> 1. 두 임베딩 벡터를 준비합니다.
>
> 2. 두 벡터의 dot product를 구합니다.
>
> 3. 각 벡터의 크기를 구합니다. (그런데 CLIP 과정에서는 사전에 이미 l2normalize를 했으므로 크기는 1이 된다.
>
> 4. dot product를 두 벡터 크기의 곱으로 나눕니다.
>
> - 1: 같은 방향 → 매우 유사
>
> - 0: 직교 → 관련이 거의 없음
>
> - −1: 반대 방향 → 매우 다름
>
> 가 됩니다. 즉 **정규화된 image embedding과 text embedding의 dot product만 계산하면 cosine similarity가 됩니다.**


학습을 통해 이 256차원 공간에서 (W의 차원이 256 차원이라고 할때)


dog image와 `"a dog"`는 가까워지고, dog image와 `"a car"`는 멀어지고 $W_i$, $W_t$, 그리고 두 encoder 자체가 같이 조정된다. * 다시 말해 W는 정답 image-text pair의 similarity가 높아지도록 **학습 과정에서 같이 업데이트되는 parameter**


> 💡 cross entropy란 무엇인가?
> > **Entropy**
>
> : **확률분포가 얼마나 불확실한지**를 나타내는 값
>
> 확률분포 ***이때 분포라고 하지만 그냥 각 클래스(사건)에 대한 확률들을 벡터로 표현한 것이다.**  $p$에 대해 엔트로피는
>
> $H(p)=−∑_ip_ilogp_i$
>
> Entropy는 **하나의 분포 자체의 불확실성**을 봅니다.
>
> $H(p, q)=-\sum_i p_i\log q_i$
>
> 반면 Cross Entropy는 **정답 분포** $p$**를 예측 분포** $q$**로 표현했을 때 얼마나 잘 맞는지**
>
> > **Cross Entropy**
>
> 정답 분포를 $y$, 모델의 예측 확률 분포를 $\hat{y}$라고 하면,
>
> $H(y,\hat{y})=-\sum_{i=1}^{C} y_i \log \hat{y}_i$
>
> - $C$: 클래스 수
>
> - $y_i$: 실제 정답 분포
>
> - $\hat{y}_i$: 모델이 예측한 클래스 의 확률
>
> 분류에서는 보통 정답이 one-hot 형태이므로, 정답 클래스가 k라면
>
> $y_k=1,\qquad y_i=0\;(i\neq k)$이기 때문에 따라서 식은 사실상 $L=−log\hat y_k$
>
> > 정답 클래스에 모델이 얼마나 높은 확률을 줬는지만 본다
>
> - 왜 log인가?
>
> - 정답 분포?

> simple pre-training task of predicting **which caption goes with which image is an efficient and scalable way to learn SOTA image representations** from scratch on a dataset of 400 million (image, text) pairs collected from the internet. After pre-training, natural language is used to reference learned visual concepts (or describe new ones) enabling zero-shot transfer of the model to downstream tasks.

이 논문의 핵심은 단순히 multimodal model을 만든 것이 아니라,

> **Natural language can act as an open-ended supervision space.**

기존 label은 `dog`, `cat`, `car`처럼 class space가 고정되어 있지만, 자연어는 새로운 concept를 거의 제한 없이 표현할 수 있습니다.


그래서 학습 후에는 새로운 dataset에 대해 별도의 classifier를 학습하지 않고

- `"a photo of a dog"`
- `"a photo of a cat"`
- `"a photo of a car"`

같은 text embedding과 image embedding의 similarity만 비교해서 classification을 수행할 수 있습니다.


⇒ 크롤링을 통해 수집한 인터넷 이미지와 caption을 활용하여 이미지와 언어간의 연관성을 학습한다. 이렇게 학습한건 Zero-shot에서도 경쟁력있는 성능을 보여준다.


## 5. Result

> The model transfers non-trivially to most tasks and is often competitive with a fully supervised baseline without the need for any dataset specific training.

![Notion image](/notion-assets/reading-note-learning-transferable-visual-models-from-natural-language-supervision/3d614b84a0f280e39d22f91dedd9165c.png)


Source: Original Document


CLIP은 dataset-specific fine-tuning 없이도 여러 benchmark에서 의미 있는 zero-shot 성능을 보였습니다.


![Notion image](/notion-assets/reading-note-learning-transferable-visual-models-from-natural-language-supervision/3d614b84a0f28048a287ea389825e57d.png)


Source: Original Document


특히 ImageNet에서는 **zero-shot CLIP이 supervised ResNet-50과 비슷한 수준의 accuracy**를 보였습니다.


> 💡 zero-shot은 무엇인가?
> > **Zero-shot**은 downstream task의 정답 라벨이 붙은 training example을 **하나도 사용하지 않고** 새로운 task를 수행하는 설정이다.
>
> **CLIP에서의 Zero-shot**
>
> CLIP은 ImageNet을 평가할 때 ImageNet training set으로 classifier를 다시 학습하지 않는다.
>
> 대신 class name을 자연어 prompt로 바꾼다.
>
> ```plain text
> "a photo of a dog"
> "a photo of a car"
> "a photo of a plane"
> ```
>
> 이후:
>
> Image→Image Encoder→v
>
> Class Prompt→Text Encoder→t
>
> 각 class의 text embedding과 image embedding의 similarity를 비교해서 가장 가까운 class를 예측한다.
>
> ---
>
> **Why Zero-shot Matters in CLIP**
>
> 1. **CLIP의 핵심 목표 자체가 Zero-shot Transfer**
>
> ---
>
> 1. **기존 Supervised Learning과의 차이를 보여줌**
>
> ---
>
> 1. **Generalization을 평가하기 좋은 조건**
>
> ---
>
> > **CLIP에서 zero-shot은 단순한 평가 방식이 아니라, 자연어 supervision으로 학습한 모델이 새로운 task를** **별도의 학습 없이 수행할 수 있는지를 검증하는 핵심 조건이다.**
>
> 즉 저자들이 보고 싶은 것은 단순히 **“좋은 feature를 학습했는가?”**가 아니라 **“새로운 task를 language로 정의하고 바로 수행할 수 있는가?”**이다.


또한 object recognition뿐 아니라

- OCR
- fine-grained recognition
- geo-localization
- action recognition

등 다양한 task로 전이되었습니다.


CLIP 이전의 vision에서는 보통 `Image→Fixed Label` 이 기본 구조였습니다.


CLIP 이후에는 `Image↔Language` 라는 관점이 본격적으로 확립되었고, 이후 BLIP, ALIGN, Flamingo, LLaVA 같은 vision-language model의 중요한 기반이 되었습니다.

1. Natural Language as Supervision

    Label space를 자연어 공간으로 확장 고정. class label 대신 자연어를 supervision으로 사용함으로써 open-ended visual concept를 학습합니다.

2. Contrastive Image-Text Alignment

    Image와 Text를 같은 embedding space에 정렬. caption generation이 아니라 image-text matching을 통해 효율적으로 학습합니다.


3. Zero-shot Classifier


    Text Encoder가 classifier를 생성. class description을 text embedding으로 만들고 image embedding과 비교하여 새로운 task를 별도 training 없이 수행합니다.

> Action을 token화하면 vision, language와 동일한 Transformer 표현 체계 안에서 다룰 수 있다. 하지만 action은 단순 semantic concept가 아니라 environment를 변화시키는 control signal이므로, alignment만으로는 부족하고 sequential prediction과 embodiment grounding이 필요하다.

## 6. Limitation


CLIP도 완전히 범용적인 것은 아닙니다.

- prompt 표현에 따라 성능이 변함

    ![Notion image](/notion-assets/reading-note-learning-transferable-visual-models-from-natural-language-supervision/3d614b84a0f280bd98c1d922a2dba201.png)


    Source: Original

- fine-grained하거나 특수한 task에서는 supervised model보다 약함
- web-scale 데이터의 bias를 그대로 학습할 수 있음
- zero-shot 성능을 높이려면 매우 큰 데이터와 compute가 필요함
- text로 표현하기 어려운 visual task에는 한계가 있음

## 7. Connection to My Research


## 8. What I Can Apply


## 9. Next Step
