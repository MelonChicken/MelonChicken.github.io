---
title: "[Reading Note] V-JEPA 2: Self-Supervised Video Models Enable Understanding, Prediction and Planning"
slug: "reading-note-v-jepa-2-self-supervised-video-models-enable-understanding-prediction-and-planning"
generated: true
status: "completed"
type: "paper-review"
researchFields: 
  - "Video Understanding"
  - "Self-supervised Learning"
featured: true
date: "2026-09-22"
paperUrl: "https://arxiv.org/abs/2506.09985"
otherSources: 
  - "https://ai.meta.com/blog/v-jepa-2-world-model-benchmarks/"
  - "https://huggingface.co/collections/facebook/v-jepa-2"
notion: "https://app.notion.com/p/Reading-Note-V-JEPA-2-Self-Supervised-Video-Models-Enable-Understanding-Prediction-and-Planning-3e214b84a0f2802c9126e850b5bcbdac"
---

<!-- This file is generated from Notion. Do not edit directly. -->

## Paper Information

> **Title:** V-JEPA 2: Self-Supervised Video Models Enable Understanding, Prediction and Planning
>
> **Authors:** Mido Assran, Adrien Bardes, David Fan, Quentin Garrido, Russell Howes, Mojtaba Komeili, Matthew Muckley, Ammar Rizvi, Claire Roberts, Koustuv Sinha, Artem Zholus, Sergio Arnaud, Abha Gejji, Ada Martin, Francois Robert Hogan, Daniel Dugas, Piotr Bojanowski, Vasil Khalidov, Patrick Labatut, Francisco Massa, Marc Szafraniec, Kapil Krishnakumar, Yong Li, Xiaodong Ma, Sarath Chandar, Franziska Meier, Yann LeCun, Michael Rabbat, Nicolas Ballas
>
>
> **Affiliation:** FAIR at Meta; Mila – Quebec AI Institute; Polytechnique Montréal
>
>
> **arXiv ID:** arXiv:2506.09985 [cs.AI]
>
>
> **Topic:** Self-Supervised Video Learning, Joint Embedding Predictive Architecture, Video Representation Learning, World Models, Action Anticipation, Video Understanding, Action-Conditioned Prediction, Robot Planning
>
>
> **Venue:** arXiv, 2025
>
>
> **Pages:** 48 pages, 19 figures
>
>

---


## 1. One-line Summary


## 2. Problem


### 2.1. 기존 world model에 대한 접근의 한계

1. Generalization 능력이 아닌 task-specific world model의 성능 입증
2. 실제 action이 아닌 visually valid-looking 한 plan에 대한 검증
    1. 지금까지는 real-world interaction data를 활용하여 학습했지만 이는 데이터셋 크기가 적어서 scale-up하기 어렵다
    2. 최근 연구들은 이 문제를 피하려고 $\text{internet video} + \text{robot interaction data}$
    를 같이 사용해 **action-conditioned video generation model**을 학습
    3. 하지만 이 방법도 robot execution using model-based control에만 활용이 되었고 계획 능력 대신에 prediction이 얼마나 faithful한가와 시각적인 퀄리티만을 측정했다.
        - visual quality & faithful prediction :
            > 생성한 미래 영상이 얼마나 현실적인가?
            > 얼마나 ground truth와 비슷한가?
        - planning capabilities
            > 그 모델을 이용해 실제 로봇이 goal까지 제대로 planning할 수 있는가?

        ⇒ 이에 대해 저자들은 그 이유로 영상 생성하는데 드는 계획의 computational cost로 추측했다.


            > ❓ GPT의 왈
            > 왜냐하면 **pixel-space video generation으로 planning하려면 계산량이 너무 큽니다.**
            >
            > 예를 들어 action 후보가 100개라면 각 action마다
            >
            > $a^{(1)}, a^{(2)}, \dots, a^{(100)}$
            >
            > 미래 영상을 전부 생성한 다음 **어느 영상이 goal에 가장 가까운가?**를 비교해야 합니다.

        > To address this limitation, more recent works have leveraged both internet-scale video and interaction data towards training action-conditioned video generation models….

> ❓ **world model이란 무엇인가?**
> > modeling both dynamics of the world, as well as mapping the static environment - **to enable efficient planning and control**
>
> - **현재 세계의 상태와 내가 취할 action을 바탕으로, 다음 세계 상태가 어떻게 변할지를 예측하는 모델**
>
> “지금 이 상태에서 내가 이렇게 행동하면 다음에는 어떻게 될까?”
>
> - **V-JEPA 2**: 현재 세계의 정보 (latent representation)을 기준으로 가까운 미래에 어떻게 표현되어야 하는가? (latent representation 예측 학습)
>
> - **V-JEPA 2-AC:** 세계가 action에 따라 어떻게 변하는가
>
> > Previous work has investigated world models in simulated tasks as well as real-world locomotion and manipulation tasks
>
> world model은 pixel-space에 대한 예측 모델로 구현되거나 learned representation space에서 예측을 하기도 하고 또한 keypoint representation과 같은 더 구조화된 representation space를 활용하기도한다.

> Previous approaches that have demonstrated **real world performance** on robotics tasks have trained task-specific world models, and they rely on **interaction data from the environment** in which the robot is deployed.

로보틱스 과제에서 real world performance를 보인 이전의 접근들에서  task-specific world model을 훈련 시켰는데 이 모델은 로봇이 실제로 활용되는 환경으로부터의 interaction 정보에 의지했다.

- 이때 평가는 탐색된 task space에서 world modeling approaches에 대해 성능을 보이는데 집중되었다 (이때 새로운 환경이나 보이지 않은 objects에 대한 generalization은 고려되지 않았다.)

    ⇒ 이 연구에서는 **특정 과제에 종속되지 않는 일반적인 world model을 학습**했고, 이 모델이 학습 때 보지 못한 새로운 환경과 새로운 물체에도 일반화된다는 것을 보인다.

    - task-specific: “이 로봇이 컵을 집는 행동”에 최적화
    - task-agnostic: “로봇의 action이 환경 상태를 어떻게 변화시키는가” 자체를 학습 (dynamics를 일반적으로 모델링)
> these approaches only demonstrate the ability **to generate visually valid-looking plans** given actions of the robot, but they have not demonstrated the ability to use those models to actually control the robot.
- 이전 연구에서는 시각적으로 유효해 보이는 계획들을 생성해내는 것만을 보였고 실제로 로봇을 조종할 수 있는가에 대한 능력은 입증하지 못했다.
> 기존 일부 연구는 generative model을 이용해서 **policy 자체를 학습**
>
> observation→action처럼 “이 상황에서는 어떤 행동을 해야 하는가”를 직접 배우는 방식
>
> - imitation learning으로 데이터 라벨링과 생성에 대해 한계점이 존재한다.
>

⇒ V-JEPA 2 쪽은 **policy를 직접 학습하지 않고 world model을 이용해 planning**


각 action sequence가 어떤 미래 상태를 만들지 예측한 다음, goal에 가장 가까운 것을 선택합니다. 이것이 여기서 말하는 **Model-Predictive Control, MPC**

    - **Policy learning**: “이 상황에서는 이렇게 행동해.”
    - **World model + Model-Predictive Control, MPC**: “이 행동을 하면 미래가 이렇게 될 것 같고, 저 행동을 하면 저렇게 될 것 같으니, 목표에 더 가까워지는 행동을 고르자.”
    - **orthogonal : 서로 독립적인 아이디어라서 둘 중 하나만 선택해야 하는 것이 아니라 결합할 수도 있다**
> Building artificial agents that learn a world model from **sensory data**
> - **sensory**: 에이전트가 환경을 직접 관찰해서 얻는 **감각 입력**
>     - **video/image 같은 visual observation**
>     - 깊이 센서
>     - LiDAR
>     - 촉각 센서
>     - 마이크
>     - proprioception(관절각, end-effector pose 등)
>
> V-JEPA 2에서 활용된 sensory data : $\text{Pretraining: video/image}$
>
>
> V-JEPA 2-AC : $\text{RGB video} + \text{end-effector state}$
>
>

## 3. Method

- **action-free pretraining**: 영상/이미지만 보고 temporal structure와 dynamics를 학습
    >
>     1. masked segments of a video in a learned representation space를 예측하게 함으로써 **represent video observation**를 한다.
>     2. 영상에서는 action token은 없어도 시간 순서가 있기에 **현재 위치와 motion을 보면 다음에는 오른쪽에 있을 가능성이 높다** 같은 **temporal regularity**를 학습하므로 결과적으로 **predictive model for world dynamics**를 학습한다.
>
>     대신 detailed pixel-level prediction을 하는 것이 아니라 (정확한 위치, 모습 트래킹) predictable aspects of a scene (움직임에서 물체가 어떻게 움직일 것인가)을 예측하는 것을 목표로 한다.
>
>
- **action-conditioned training**: V-JEPA 2-AC에서 실제 action 를 넣어 미래 상태를 예측
- **stage wise training procedure:**  한 번에 전부 같이 학습하지 않고, 단계별로 나눠서 학습한다

    ![Notion image](/notion-assets/reading-note-v-jepa-2-self-supervised-video-models-enable-understanding-prediction-and-planning/3e814b84a0f2802590dfe2a2413337de.png)


    Source: Original Document

    1. **(V-JEPA 2) action-free pre-training** on internet-scale video
        - mask-denoising feature prediction objective : 늘 하던데로 masked segment를 learned representation space에서 예측하게 한다.
        - with 1 billion parameters and with more than 1 million hours of video.

        ⇒ 이 과정에서 scaling self-supervised video pretraining이 encoder의 broad motion을 포함한 visual understanding과 appearance recognition capabilities에 대한 능력을 가오하한다느 것을 밝혔다.

        > 어떻게 증명했는기 probe-based evaluation an dlaigning the encoder with a language model for video question-answering
    2. **(V-JEPA 2-AC) post-training** with a small amount of interaction data
        > 300M-parameter transformer network

        > ❓ **Causal Attention 과 Block-causal Attention**
        > - Causal Attention
        >
        > - Block-Causal Attention


---


![Notion image](/notion-assets/reading-note-v-jepa-2-self-supervised-video-models-enable-understanding-prediction-and-planning/3e814b84a0f280ce99a4c188918bf857.png)


Source: Original Document


### V-JEPA 2


**Mask-Denoising in Representation Space**


$minimize_{θ,φ,∆y} ∥P_φ(∆_y, E_θ(x)) − sg(E_{\barθ}(y))∥_1,$

- $E_θ(·)$ : extracts **video representations**
- $P_φ(·)$ : a **predictor**, which predicts **the representation of masked video parts**.
- $\Delta_y$ : learnable mask token that indicates the **locations of the dropped patches**
- $sg(·)$ : stop-gradient operation
- $\bar \theta$ : weights of $\theta$ of the encoder network to prevent representation collapse

Architecture


encoder와 predictor는 ViT로서 학습된다.


> ❓ **V-JEPA 2는 어떻게 temporal axis를 붙이는가?**
> - 입력 video는 frame을 독립적으로 patchify하는 게 아니라, **(**$2\times16\times16)$ **tubelet**으로 나눈다.
>
> - 시간축을 모델이 구분할 수 있게 만드는 직접적인 장치는 **3D-RoPE**
>
> **Tubelet Tokenization**으로 **시간축 자체를 token 구조 안에 넣고**, **3D-RoPE**로 **각 token의 temporal position을 구분**


> ❓ temporal position을 붙인 RoPE가 무슨 원리인가
> **RoPE (Rotary Position Embedding)**
>
> 기존의 Sinusoidal Positional Embedding과는 다르게, **쿼리(Q)와 키(K)에 회전을 적용하여 위치 정보를 각도(rotation)로 인코딩**
>
> - 위치 번호를 각도(angle)로 바꿔서 벡터 방향을 조금씩 돌린다
>
> ⇒ 이렇게 한다면 attention score가 $q_i^T k_j$로 계산되는데 RoPE를 적용하면
> $(R_i q_i)^T(R_j k_j)$ 가 되고, **두 위치의 차이** $i-j$가 자연스럽게 들어간다
>
> - feature dimension을 $(T,H,W)$용 세 구간으로 나누고, 각 구간 안에서 기존 1D-RoPE의 **2×2 rotation matrix를 반복 적용**
>
> > absolute sincos position embedding 대신 3D-RoPE를 활용함으로써 큰 모델들의 학습 안정화에 도움이 되었다.


Key Scaling Ingredients

> V-JEPA에서 V-JEPA 2로 넘어오면서 사전학습 단계에서 scaling을 가능하게 한 네가지 요소
1. Data scaling : dataset 사이즈를 2M에서 22M로 규모를 키웠다. (VM22M)

![Notion image](/notion-assets/reading-note-v-jepa-2-self-supervised-video-models-enable-understanding-prediction-and-planning/3e814b84a0f28070a283cd2f9a51fafb.png)


Source: Original Document

1. Model  scaling : encoder의 사이즈가 300M개의 파라미터에서 1B개의 파라미터로 키우면서 ViT-L에서 ViT-g가 되었다.
2. Longer training : warmup-constant-decay learning rate schedule을 활용해서 하이퍼파라미터 튜닝을 단순화하였고 90.000에서 252,000로 iteration을 증가했는데 이를 통해 추가적인 데이터를 소화할 수 있었다.
3. Higher resolution : warmup-constant-decay schedule에다가 영상의 해상도를 더 높이고 영상 클립을 더 길게 규모를 키우게 되었는데, warmup 단계에서 shorter, lower-resolution clips에 대해 학습을 하고 decay phase에서 해상도와 길이를 증가시켰다.

    > ❓ **warm-constant-decay learning rate schedule이란 무엇인가?**
    > 1. **warmup** 동안 학습률을 작은 값에서 목표값까지 점진적으로 올립니다. 초기부터 큰 learning rate를 쓰면 큰 모델 학습이 불안정할 수 있기 때문입니다.
    >
    > 2. 이후 **constant phase**에서는 학습률을 일정하게 유지하면서 대부분의 학습을 진행하고
    >
    > 3. 마지막 **decay/cooldown phase**에서는 학습률을 다시 점차 낮춥니다. (+ **입력 video의 길이와 해상도**도 키움 stage 4 - higher resolution의 경우)


![Notion image](/notion-assets/reading-note-v-jepa-2-self-supervised-video-models-enable-understanding-prediction-and-planning/3e814b84a0f28032adb4e5d8b72c0cef.png)


Source: ChatGPT 생성 이미지

- **V-JEPA 2가 쓰는 warmup–constant–decay 스케줄이, 기존에 흔히 쓰는 half-cosine learning-rate schedule과 성능이 거의 비슷했다. 하지만 긴 학습과 여러 cool down 설정을 실험하기에는 warmup-constant-decay가 더 적합했다고 한다.**

    ![Notion image](/notion-assets/reading-note-v-jepa-2-self-supervised-video-models-enable-understanding-prediction-and-planning/3e814b84a0f280019ce4c3a3d4fa7e42.png)


    Source: ChatGPT 시각화 기능


Evaluation Protocol


| 구분         | Dataset                | 주로 평가하는 정보                           |
| ---------- | ---------------------- | ------------------------------------ |
| Motion     | Something-Something v2 | object interaction, motion direction |
| Motion     | Diving-48              | 동작의 temporal structure               |
| Motion     | Jester                 | human gesture / movement             |
| Appearance | Kinetics               | action + scene/appearance cue        |
| Appearance | COIN                   | instructional action / appearance    |
| Appearance | ImageNet               | object appearance                    |


freeze encoder + task-specific 4-layers attentive probing


downstream task 성능이 좋아졌다고 해서 encoder까지 task-specific하게 fine-tuning해서 좋아진 것이 아니라 **이미 pretraining 단계에서 만들어진 representation에 얼마나 유용한 정보가 들어 있는가**를 보려는 것


![Notion image](/notion-assets/reading-note-v-jepa-2-self-supervised-video-models-enable-understanding-prediction-and-planning/3e814b84a0f2804cac25ec9d00be17b0.png)


Source: Original Document


Scaling Dataset Size


![Notion image](/notion-assets/reading-note-v-jepa-2-self-supervised-video-models-enable-understanding-prediction-and-planning/3e814b84a0f280aa8419f023119b274d.png)


Source: Original Document

> 하나의 pretraining data mixture를 만들고 학습 시 source별 확률로 샘플링했다
> To enable joint image and video pretraining, we duplicate **an image temporally and treat it as a 16-frame video** where all frames are identical.

매 training sample을 뽑을 때 대략: SSv2에서 5.6%, Kinetics에서 18.8%, HowTo100M에서 31.8%, YT-Temporal-1B에서 18.8%, ImageNet에서 25.0% 확률로 source를 먼저 선택하고, 그 source에서 실제 sample을 뽑는 방식

- Apply Curation의 의미

    : YT-Temporal-1B 데이터를 그대로 전부 쓰지 않고, 학습에 넣기 전에 품질/분포 기준으로 걸러서 재구성했다 (action/video understanding에 더 유용해 보이는 장면들을 retrieval 기반으로 선별해서 사용)

    - YT1B는 약 **140만 시간** 규모라 매우 크지만, Kinetics나 SSv2처럼 사람이 잘 정제한 데이터셋과 달리 **curation이 거의 없고 filtering도 약한 데이터**

        $\text{YT1B videos}\rightarrow\text{scene extraction}\\\rightarrow\text{scene embedding}\rightarrow\text{clustering}\\\rightarrow\text{target distribution에 맞는 scene retrieval}$


![Notion image](/notion-assets/reading-note-v-jepa-2-self-supervised-video-models-enable-understanding-prediction-and-planning/3e814b84a0f2805ca3fac1289c60ddff.png)


Source: Original Document


![Notion image](/notion-assets/reading-note-v-jepa-2-self-supervised-video-models-enable-understanding-prediction-and-planning/3e814b84a0f28069b739e7973e9ca827.png)


Source: Original Document

> 실제 data curation statistics에서 활용한 통계 정보

Efficient Progressive-Resolution Training

> 이전 연구에 대해서는 16 frame의 (대충 초단위) 짧은 클립에 집중했지만 V-JEPA 2의 경우 64 frame (16초 정도) + higher resolution으로 학습을 진행했다
>
> ⇒ 이렇게 하다보니 길이도 길어지고 해상도도 높아짐에 따라 학습 시간이 급격하게 느ㅡㄹ어나게 되었다.
>
>
> ![Notion image](/notion-assets/reading-note-v-jepa-2-self-supervised-video-models-enable-understanding-prediction-and-planning/3e814b84a0f28014bd74c6e9ba9fdee6.png)
>
>
> Source: Original Document - Figure 5 Model Scaling
>
>

![Notion image](/notion-assets/reading-note-v-jepa-2-self-supervised-video-models-enable-understanding-prediction-and-planning/3e814b84a0f280838b58d5739c8998d1.png)


Source: Original Document

- **progressive resolution strategy**는 처음부터 긴 영상·고해상도로 학습하지 않고, **초반에는 짧고 낮은 해상도로 싸게 학습한 뒤 마지막 단계에서 해상도와 영상 길이를 키우는 전략**

    초기/중간 학습
    16 frames × 256×256
    ↓
    대부분의 representation 학습
    ↓
    마지막 cooldown
    64 frames × 384×384
    ↓
    긴 시간 문맥 + 세밀한 공간 정보에 적응

    - warm-up때는 16 프레임으로 256X256 해상도 영상으로 진행 (12K iterations)
    - main training phase 때는 228K iteration
    - cooldown phase : 12K iteration으로 돌리면서 video duration과 resolution을 늘린다.
- we achieve an **8.4× reduction in GPU time** for a model that can ingest 64-frame, 3**84 × 384** resolution inputs
    > 실제로 학습을 진행한 결과 8.4배 더 빠르게 진행한다

    ![Notion image](/notion-assets/reading-note-v-jepa-2-self-supervised-video-models-enable-understanding-prediction-and-planning/3e814b84a0f280149f75c83ea4901033.png)


    ![Notion image](/notion-assets/reading-note-v-jepa-2-self-supervised-video-models-enable-understanding-prediction-and-planning/3e814b84a0f280d6ac06fda7ed8e86d9.png)


    Source: Original Document

    > 단순히 시간만 줄어든게 아니라 성능 역시 개선된 모습을 보인다.

### V-JEPA 2-AC

- excocentric 카메라로 촬영된 tabletop arm에 대한 instantiation을 진행
    - Droid dataset을 활용했는데 총 62h 영상이 있고 3-4초의 길이의 짧은 영상을 담고 있다.
        - 이 데이터 외에 다른 과제에 대한 정보라던가 어떤 동작이 성공적이었는지에 대해서는 알려주지 않는다.
        - 오직 raw video + end-effector stage signlas from the dataset
    - 7-DoF Franka Emika Panda arm에 대한 영상을 가지고 학습을 진행하는데 손가락이 두개 달려있는 gripper다

        ![Notion image](/notion-assets/reading-note-v-jepa-2-self-supervised-video-models-enable-understanding-prediction-and-planning/3e914b84a0f280e19219f7cd2a294480.png)


        Source: [https://robodk.com/robot/ko/Franka/Emika-Panda](https://robodk.com/robot/ko/Franka/Emika-Panda)


Model Input

- $256\times 256$의 해상도를 가지면서 4fps를 가지고 있는데 $(x_k)_{k\in[16]}$으로 표시된 16 frame clips을 생성한다.
- sequence 정보의 경우 $(s_k)_{k\in[16]}$로 설정하는데 robot의 base에 따른 상대적인 실제 값 7D vector
    - 첫 세개의 차원의 경우 cartesian position of the end-effector
    - 나머지 세개의 차원의 경우 extrinsic Euler angle 형태의 회전 정도
    - 마지막은 gripper state

loss function

- image encoder들의 경우 별다른 추가 tuning없이 frozen상태로 두고 predictor만 학습을 진행시킨다.


![Notion image](/notion-assets/reading-note-v-jepa-2-self-supervised-video-models-enable-understanding-prediction-and-planning/3e914b84a0f28061946bdfe8f026387d.png)


Source: Original Document - teacher-forcing loss function computation

    - $T=15$로 계산된다

    > ❓ two-step rollout loss란 무엇인가?
    > **: 자기 예측값을** **다시 입력으로 넣었을 때도 다음 미래를 잘 예측하도록 학습하겠다**
    >
    > $(\hat z_k,a_k,s_k)\rightarrow\hat z_{k+1}$
    >
    > - 만약 첫번째 예측 ($\hat z_{k+1}$)이 작은 오차라도 있으면 다음 예측에서 이미 오차가 있는 입력을 사용하기에 오차가 계속 커질 수 있다 ⇒  **error accumulation**
    >
    > - 실제 $z_2$ (정답)를 주지 않고 $(z_1,a_1)\rightarrow\hat z_2$ 다음 $(\hat z_2,a_2)\rightarrow\hat z_3$처럼 **자기 예측을 다시 feed back**
    >
    > - 이후 최종 예측을 실제 미래 representation과 비교


$L(φ) := L_{\text{teacher-forcing}}(φ) + L_{\text{rollout}}(φ) \text{   (practically, }T=2)$


Architecture


![Notion image](/notion-assets/reading-note-v-jepa-2-self-supervised-video-models-enable-understanding-prediction-and-planning/3ea14b84a0f280728559fa2a9b01f6bd.png)


Source: Original Document

> Left: teacher-forcing 산출 과정
> > the predictor takes **the encoding of the current frame representation** as input and learns to predict the representation of the next timestep.
>
> Right: Rollout Loss 산출 과정
>
> > The rollout loss involves feeding the predictor’s output back as input, allowing the model to be trained to predict several timesteps ahead.
>

~300M parameter의 24-layer Transformer network 구조를 띄고 있는데 헤드는 16개, 1024-dimension의 은닉층, GELU activation 을 가지고 있다.

- **affine transformation** : $\bold y = W\bold x + \bold b$ 형태의 **선형변환 + bias (learnable affine transformation, learnable projection layer)**
    1. **차원 변환** : action은 7D인데 predictor hidden size는 1024라면 $\mathbb{R}^{7}\rightarrow\mathbb{R}^{1024}$로 바꿔줘야 한다.
    2. **modality별로 다른 projection을 학습** $W_a,\;W_s,\;W_z$
- **GELU (Gaussian Error Linear Unit)** activation function

    $\text{GELU}(x)=0.5\times x\times (1+Tanh(\sqrt{2/π}\times (x+0.044715\times x^3)))$


    ![Notion image](/notion-assets/reading-note-v-jepa-2-self-supervised-video-models-enable-understanding-prediction-and-planning/3ea14b84a0f2809b8220f50d8a1e0150.png)


    Source: [https://docs.pytorch.org/docs/2.14/generated/torch.nn.GELU.html](https://docs.pytorch.org/docs/2.14/generated/torch.nn.GELU.html)


Inferring Actions by Planning


![Notion image](/notion-assets/reading-note-v-jepa-2-self-supervised-video-models-enable-understanding-prediction-and-planning/3ea14b84a0f280b6ae93e64e4472f02c.png)


Source: Original Document


**Energy minimization**


목표 state의 이미지가 주어졌을때 V-JEPA 2-AC를 downstream tasks에 활용하기 위해 planning을 이용한다. 각 time step 마다 고정된 시간 축에 대해서 action sequence를 계획하는데 이는 goal-conditioned energy function을 최소화하는 방향으로 진행된다. 그런뒤 첫 action을 하고 state를 갱신하고 다시 이 과정을 반복한다.

- **goal-conditioned energy function** : _“이 action sequence를 실행했을 때, 예측된 미래 상태가 목표 상태와 얼마나 가까워지는가?”_를 숫자로 평가하는 함수

    $E(\hat a_{1:T} ; z_k, s_k, z_g) := ∥P (\hat a_{1:T} ; s_k, z_k) − z_g∥_1$

- planning이란 결국 $\hat a_{1:T}^{*}=
\arg\min_{\hat a_{1:T}}
E(\hat a_{1:T})$
- **end effector**는 로봇 팔의 맨 끝에서 실제로 환경과 상호작용하는 부분 (e.g. gripper, suction cup, welding tool, screwdriver)

## 4. Key Idea

> V-JEPA 2는 대규모 self-supervised video pretraining을 통해 **video understanding, future prediction, planning**까지 연결되는 representation을 학습하는 것을 목표로 한다. 논문은 이를 크게 **Understanding / Prediction / Planning** 세 가지 관점에서 평가한다.

![Notion image](/notion-assets/reading-note-v-jepa-2-self-supervised-video-models-enable-understanding-prediction-and-planning/3e814b84a0f2809d8517fb700adc87b1.png)


Source: Original Document

- **task-agnostic:** **task-specific이 아닌 여러 task에 재사용 가능한 일반적인(world-dynamics) 모델**

### 1. Understanding — Probe-based Classification

> **Question:** V-JEPA 2 representation이 실제로 appearance와 motion 정보를 잘 포함하고 있는가?
- V-JEPA 2 encoder를 **freeze**한 상태에서 attentive probe만 학습하여 representation의 품질을 평가한다.
- 특히 **fine-grained motion information**을 잘 encode하는지 확인한다.
- Something-Something v2와 같이 object appearance만으로는 풀기 어렵고, **움직임의 방향·순서·상호작용**을 이해해야 하는 task에서 강한 성능을 보인다.
- SSv2에서 **77.3 Top-1 Accuracy**를 기록한다.

**핵심 의미**


$\text{Video SSL}\rightarrow\text{Representation containing motion information}$


즉, 별도의 action label로 representation을 사전학습하지 않아도 **시간적 변화와 세밀한 motion structure를 latent representation에 담을 수 있음**을 보여준다.


---


### 2. Understanding — Video Question Answering

> **Question:** Language supervision 없이 학습한 video representation도 language model과 연결하여 semantic/temporal reasoning에 활용할 수 있는가?
- V-JEPA 2 encoder를 visual encoder로 사용하고 LLM과 alignment하여 MLLM을 구성한다.
- V-JEPA 2 자체는 **language supervision 없이 pretraining**된다.
- 이후 projector와 visual instruction tuning을 통해 visual representation을 LLM input space와 연결한다.
- Physical understanding과 temporal reasoning이 필요한 여러 Video QA benchmark에서 높은 성능을 보인다.

주요 결과:


| Benchmark      | Metric                | V-JEPA 2 |
| -------------- | --------------------- | -------- |
| MVP            | Paired Accuracy       | 44.5     |
| PerceptionTest | Accuracy              | 84.0     |
| TempCompass    | Multi-choice Accuracy | 76.9     |
| TemporalBench  | Multi-binary Short-QA | 36.7     |
| TOMATO         | Accuracy              | 40.3     |


**핵심 의미**


$\text{Language-free Video SSL}\rightarrow\text{Visual Representation}\\\rightarrow\text{Language Alignment}\rightarrow\text{Video QA}$


즉 **좋은 video representation을 만들기 위해 반드시 처음부터 language supervision이 필요한 것은 아니다**라는 점을 보여준다.


---


### 3. Prediction — Human Action Anticipation

> **Question:** V-JEPA 2가 현재 action을 이해하는 것을 넘어, 앞으로 일어날 action까지 예측할 수 있는가?
- Epic-Kitchens-100의 **human action anticipation** task에서 평가한다.
- 현재 context video를 보고 **1초 뒤 시작될 action**을 예측한다.
- encoder는 freeze하고 attentive probe를 학습한다.
- V-JEPA 2 ViT-g384는 **Recall@5 = 39.7**을 기록한다.
- 논문 기준 기존 최고 모델 대비 **44% relative improvement**이다.

**핵심 의미**


단순히 **What is happening now?**를 넘어서 **What is likely to happen next?**를 예측할 수 있다는 것이다.


즉 V-JEPA 2 representation이 단순 appearance representation이 아니라 **temporal dynamics와 future-relevant information도 포함한다는 근거**가 된다.


---


### 4. Planning — Robot Manipulation

> **Question:** 학습된 representation을 실제 agent의 action planning에 사용할 수 있는가?

V-JEPA 2를 그대로 사용하는 것이 아니라, 이후 **V-JEPA 2-AC**를 post-train한다.


$\text{V-JEPA 2}+\text{62 h robot interaction data (Droid Dataset)}\rightarrow\text{V-JEPA 2-AC}$

> an **autoregressive model** that predicts representations of future video observations **conditioned on control actions and proprioceptive observations.**

V-JEPA 2 encoder는 freeze하고, action-conditioned predictor를 추가하여


$(z_t, a_t, s_t)\rightarrow\hat z_{t+1}$를 학습한다.

- **learnable affine transformation**을 적용해서 predictor의 hidden dimension인 1024차원으로 변환
>
>
> $s_k = \text{robot state / pose}\\a_k = \text{robot action}$
>
>
> 논문에서 $s_k$는 7차원으로, $s_k = [x,y,z,\ \text{roll},\text{pitch},\text{yaw},\;\text{gripper}]$ 이고,
>
>
> action $a_k$는 인접한 두 frame 사이의 end-effector state 변화 $a_k = s_{k+1}-s_k$
>
>

이후 MPC를 이용하여 predicted future representation과 goal representation의 거리가 가장 작아지는 action sequence를 찾는다.

- DROID의 **62시간 이하 unlabeled robot interaction data** 사용
- 새로운 lab 환경에서 별도 추가 training 없이 배치
- task-specific reward 없음
- task-specific training 없음
- novel object 및 unseen environment에서
    - Grasp
    - Reach with Object
    - Pick-and-Place

등의 manipulation task를 수행한다.


**핵심 의미**


$\text{Understanding}\rightarrow\text{Prediction}\rightarrow\text{Planning}$


으로 representation을 실제 행동까지 연결할 수 있음을 보여준다.

- exocentric : 3인칭 시점에서의 카메라
- egocentric : 1인칭 시점에서의 카메라

---


## 5. Result

> web-scale data와 소량의 robot interaction data를 가지고 sel-supervised learning을 통해 world 모델이 understanding/predicting/planning에 활용할 수 있는 모델이 되었다
>
> + motion understanding 과 human action anticipation을 요구하는 action classification 분야에서는 SOTA르 ㄹ달성했다
>
>
> + video QNA의 경우에서도 이전 vision encoder에 비해서 더 좋은 성능을 보여주었다.
>
>
> V-JEPA 2-AC의 경우 V-JEPA 2의 representation을 활용함과 동시에 zero-shot **물체를 실제로 쥐거나 집는 동작이 포함된 과제의 경우 (e.g. Pick-and-Place) 좋은 성능을 보여줌.**
>
> ⇒ V-JEPA 2가 환경에서 효과적으로 인식하고 생동할 수 있음을 보여줌
>
>

### 5.1. Planning: Zero-shot Robot Control

> demonstrate how V-JEPA 2-AC can be used to implement **basic robot skills** like reaching, grasping, and pick-and-place via model-predictive control. We focus on tasks with **visual goal specification** and show that V-JEPA 2-AC generalizes zero-shot to new environments
- 목표는 language가 아니라 **goal image**로 주어지고, 모델은 현재 상태에서 여러 action sequence를 상상한 뒤 goal representation과 가장 가까워지는 sequence를 선택
> **비교 대상**
- behavior cloning 기반 VLA인 Octo (open-source weights of the octo-base-1.5 version)
    > Open-X Embodiment dataset에 사전학습이 이루어졌다 (1M trajectories)
>
>     이후 Droid Dataset으로 fin-tuning을 진행했다.
>
>

    ![Notion image](/notion-assets/reading-note-v-jepa-2-self-supervised-video-models-enable-understanding-prediction-and-planning/3ea14b84a0f2809cac22e2a1f49fe45a.png)


    Source: [https://octo-models.github.io/](https://octo-models.github.io/)

- video generation world model인 Cosmos

    ![Notion image](/notion-assets/reading-note-v-jepa-2-self-supervised-video-models-enable-understanding-prediction-and-planning/3ea14b84a0f280a2be05ec5d53142c3f.png)


    Source: [https://huggingface.co/blog/mingyuliutw/nvidia-cosmos](https://huggingface.co/blog/mingyuliutw/nvidia-cosmos)

- V-JEPA 2-AC는 새로운 두 lab의 Franka robot에 **zero-shot deployment**되고, 그 환경에서 추가 학습이나 task-specific reward를 사용X

5.1.1. Result


**Single-goal reaching**


![Notion image](/notion-assets/reading-note-v-jepa-2-self-supervised-video-models-enable-understanding-prediction-and-planning/3ea14b84a0f280c49610c9ec46d33d71.png)


Source: Original Document


V-JEPA 2-AC를 활용했을때 모델이 목표 위치로부터 4cm 이하로 접근했다.


⇒ V-JEPA 2-AC는 일종의 Visual servoing 형태라고 볼 수 있는데, **Visual servoing**은 카메라에서 들어오는 **시각 정보 자체를 feedback으로 사용해서 로봇의 움직임을 제어하는 방식**


→ 그런데 이걸 unlabeled, real-world video data로 했다는 것이 주목할 포인트.


![Notion image](/notion-assets/reading-note-v-jepa-2-self-supervised-video-models-enable-understanding-prediction-and-planning/3ea14b84a0f2808eabc2dbcc4c797819.png)


Source: Original Document

> V-JEPA 2-AC가 “어느 방향으로 움직이면 목표에 가까워지는지”를 energy landscape 형태로 꽤 매끄럽게 학습했다
>
> +random하거나 울퉁불퉁하지 않고 smooth한 bowl 형태
>
>
> ⇒ V-JEPA 2-AC가 단순히 다음 frame을 외운 게 아니라, **action이 future state에 어떤 영향을 주는지 어느 정도 연속적인 구조로 학습했다.**
>
>

![Notion image](/notion-assets/reading-note-v-jepa-2-self-supervised-video-models-enable-understanding-prediction-and-planning/3ea14b84a0f28052bd18d42fdc1650f0.png)


Source: Original document

> V-JEPA 2-AC가 Octo에 비해 zero-shot robot manipulation에서 좋은 성적을 보여주었다.
- hindsight relabeling: 이미 수집된 trajectory를 보고, 나중에 실제로 도달한 상태를 **“원래 목표였던 것처럼 다시 라벨링해서” 학습에 재사용하는 방법**
    > 어차피 실제로 B에는 도달했으니, 이 trajectory를 `goal=B`를 성공적으로 달성한 예시로 다시 쓰자

**Limitations**

1. **Sensitivity to camera positioning**
    > V-JEPA 2-AC는 별도의 camer calibration 없이 Cartesian control action에 대ㅎ한 다음 영상 프레임의 representation을 예측하도록 되었기 때문에 반드시 **monocular RGB camera input**이 있어야 한다.
>     - **monocular RGB camera input** : **한 대의 일반 RGB 카메라로 들어오는 영상 입력**
>
>         **stereo camera나 depth camera 없이**, 한 대의 일반 컬러 카메라 영상만 보고 로봇 주변을 이해하기에 monocular camera는 **깊이(depth)를 직접 측정하지 못하므로** 모델은 화면 속 크기, 원근, 움직임, 물체 관계 같은 시각적 단서를 이용해서 3D 구조를 간접적으로 추론해야 한다.
>
>
2. **Long horizon planning**

    world model의 long horizon planning은 몇가지 요소로 인해 제한되어있다.

    1. autoregressive prediction은 error accumulation이 발생한다. → 따라서 긴 길이의 계획을 신뢰성 있게 만들어내기 어렵다
    2. search space가 증가하게 되는데, planning horizon을 조금만 늘려도, 고려해야 하는 action sequence의 경우의 수는 기하급수적으로 늘어난다
3. **Image goals**

    현재 실험은 visual goal이 주어져야 하지만 실제로는 language 같은 형태의 목표가 더 자연스러운 경우가 많다.


### 5.2. Understanding: Probe-based Classification

>
>
> V-JEPA 2가 학습한 representation에 **실제로 어떤 visual information이 들어 있는가**를 평가 (w frozen encoder)
>
> - Motion understanding: SSv2, Diving-48, Jester
> - Appearance understanding: K400, COIN, ImageNet
>

![Notion image](/notion-assets/reading-note-v-jepa-2-self-supervised-video-models-enable-understanding-prediction-and-planning/3ea14b84a0f280bc9f4fcdeb0acec453.png)


Source: Original Document


4-layer attentive probing을 진행하였다. 하나의 attentive probe는 4개의 transformer block을 가지고 있는데 마지막 블록은 표준 self-attention 대신에 cross-attention layer를 사용하며 learnable query token을 활용한다.

> V-JEPA 2 representation 자체에 motion과 appearance를 분류할 수 있는 정보가 잘 들어 있는가? ⇒ 그렇다

---


### 5.3. Prediction: Probe-based Action Anticipation

> 여기서는 단순히 현재 action을 분류하는 게 아니라 “조금 뒤에 사람이 어떤 행동을 할 것인가?”를 예측한다.
>
> e.g. Epic-Kitchens-100에서 모델은 context를 보고 미래의 verb, noun, action을 예측
>
>
> An attentive probe is trained on top of the frozen V-JEPA 2 encoder and predictor to anticipate future actions.

![Notion image](/notion-assets/reading-note-v-jepa-2-self-supervised-video-models-enable-understanding-prediction-and-planning/3ea14b84a0f28063ad9ad6810b38a9cc.png)


Source: Original Document


![Notion image](/notion-assets/reading-note-v-jepa-2-self-supervised-video-models-enable-understanding-prediction-and-planning/3ea14b84a0f28034965ed6d7e600e34b.png)


Source: Original Document

> **representation이 현재를 잘 표현하는 것뿐 아니라, 미래 action을 예측할 만큼 temporal predictive information도 가지고 있는가**
>
> ⇒ 실제로 가장 좋은 성능을 보여주며 미래 action을 예측할 수 있는 정도의 temporal predictive information도 가지고 있다.
>
>

---


### 5.4. Understanding : Video Question Answering


![Notion image](/notion-assets/reading-note-v-jepa-2-self-supervised-video-models-enable-understanding-prediction-and-planning/3ea14b84a0f280feac8ff3f40336ef7b.png)


Source: Original Document

> V-JEPA 2를 **language model과 연결했을 때 video를 자연어로 이해할 수 있는가**
>
> V-JEPA 2가 pretraining 단계에서 **language supervision을 전혀 사용하지 않았다는** 것
>
>

핵심은 V-JEPA 2 자체를 처음부터 language supervision으로 다시 학습하는 게 아니라, **이미 학습된 visual encoder와 LLM 사이에 projector를 두고 단계적으로 정렬(alignment)한다**

    1. image captioning으로 projector 학습
    2. image QA로 전체 model 학습
    3. video captioning + video QA로 추가 학습

⇒ 언어 없이 학습한 video representation도 나중에 LLM과 alignment하면 language-based video understanding에 사용할 수 있는가?


![Notion image](/notion-assets/reading-note-v-jepa-2-self-supervised-video-models-enable-understanding-prediction-and-planning/3ea14b84a0f28046b2bbcc8e5327d5f4.png)


![Notion image](/notion-assets/reading-note-v-jepa-2-self-supervised-video-models-enable-understanding-prediction-and-planning/3ea14b84a0f280a8b995d784081720dd.png)


Source: Original Document


## 6. Limitation


### 1. Long-horizon prediction & planning


현재 V-JEPA 2는 대략 **최대 16초 정도 미래를 예측하는 task**에 초점을 맞춥니다. 이 정도 horizon에서는 grasp나 reach-with-object처럼 비교적 단순한 manipulation은 하나의 goal image만으로 계획할 수 있습니다. 하지만 pick-and-place처럼 더 긴 sequence가 필요한 task는 중간 **sub-goal**을 따로 제공해야 합니다.


즉 현재 구조의 한계는:


$\text{short horizon}\rightarrow\text{works reasonably well}$ 이지만


$\text{long horizon}\rightarrow\text{prediction error accumulation + planning difficulty}$가 커진다


저자들이 제안하는 방향은 **hierarchical model**입니다. 즉 하나의 시간 해상도로 모든 미래를 예측하는 대신,


**short-term fine-grained prediction**과 **long-term abstract prediction**을 서로 다른 spatial / temporal scale과 abstraction level에서 처리하는 방식입니다.


핵심 아이디어는:

> 가까운 미래는 세밀하게, 먼 미래는 더 추상적으로 예측하는 계층적 world model

입니다.


---


### 2. Image goal → Language goal


현재 V-JEPA 2-AC는 task를 **goal image**로 지정합니다.


e.g. $\text{current image}+\text{goal image}\rightarrow\text{action planning}$ 형태


하지만 실제 환경에서는 사용자가

> “컵을 상자 안에 넣어”

처럼 **자연어로 목표를 주는 방식**이 더 자연스러울 수 있습니다. 그래서 저자들은 language goal을 V-JEPA 2-AC의 **latent representation space에 embedding하는 방향**을 future work로 제안합니다.


즉 목표는 $\text{Language goal}\rightarrow z_{\text{goal}}$로 변환해서 $\hat z_{\text{future}}\approx z_{\text{goal}}$이 되도록 planning하는 것


Section 7에서 이미 V-JEPA 2 representation을 language model과 align할 수 있음을 보여줬기 때문에, 저자들은 이를 출발점으로 보고 있습니다.


---


### 3. Further model scaling


이 논문에서는 V-JEPA 2를 최대 약 **1B parameters**까지 scale했습니다. 그리고 model size를 키울수록 downstream 성능이 지속적으로 좋아졌습니다.


하지만 기존 vision encoder 연구에서는 이미 $20B$ 수준까지 scale한 사례가 있기 때문에, $1B \rightarrow 20B+$까지 실험해보아야 한다.

> 다만 단순히 모델 크기만 키우는 것이 아니라, **큰 모델에서도 효율적이고 안정적으로 학습 가능한 pretraining recipe를 개발하는 것**

| 현재 한계                  | 문제                     | Future Work                            |
| ---------------------- | ---------------------- | -------------------------------------- |
| Short-horizon planning | 긴 task에서는 sub-goal 필요  | Hierarchical world model               |
| Image-based goal       | 실제 사용자 지시는 보통 language | Language-conditioned goal              |
| Max 1B scale           | 더 큰 scale의 가능성 미검증     | Scalable pretraining for larger models |


## 7. Connection to My Research


## 8. What I Can Apply


## 9. Next Step
