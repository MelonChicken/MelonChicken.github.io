---
title: "[Study Record] 파이토치 첫 걸음"
slug: "study-record"
generated: true
status: "completed"
domain:
  - "Deep Learning"
type: "learning-note"
researchFields:
  - "ML"
featured: false
date: "2026-07-25"
otherSources:
  - "https://cs231n.github.io/"
notion: "https://app.notion.com/p/Study-Record-3aa14b84a0f2800bae5afceaa73a20e5"
---

<!-- This file is generated from Notion. Do not edit directly. -->

# Chapter 02 - 파이토치


## Pytorch 초기 설정법

> CUDA : 엔비디아가 GPU를 통한 연산을 가능하게 만든 API 모델
>
> cnDNN : CUDA를 통해 **딥러닝 연산을 가속**해주는 라이브러리
>
>

### 교재의 경우

    1. 아나콘다 for linux 설치 및 환경변수 설정

        ```bash
        wget anacondaDownloadLink
        bash 해당아나콘다설치쉘
        ```


        ```bash
        conda create -n pytorch python=3.X # pytorch라는 이름의 파이썬 버전 3.X를 사용하는 프로젝트를 생성한다
        source activate pytorch # 해당 프로젝트를 활성화 한다.
        ```

    2. CUDA설치[https://docs.nvidia.com/cuda/cuda-installation-guide-linux/index.html](https://docs.nvidia.com/cuda/cuda-installation-guide-linux/index.html)
    3. cuDNN설치

### 연구실 서버의 경우

    > 이미 개인용 프로젝트를 셋업했다는 전제하에 진행
>
>     ```bash
>     mkdir gpu-check
>     cd gpu-check
>     uv init --vcs none .
>     ```
>
>

    ```bash
    랩 서버 전체
    ├── NVIDIA GPU
    ├── NVIDIA Driver          ← 서버 관리자가 설치
    ├── 시스템 CUDA 환경       ← 서버 관리자가 관리
    │
    └── 사용자별 프로젝트
        ├── .venv
        ├── pyproject.toml
        ├── uv.lock
        └── PyTorch CUDA wheel ← 사용자가 uv로 설치
    ```

    1. `pyproject.toml`에 PyTorch CUDA 12.8 저장소를 지정한다.

        ```bash
        [[tool.uv.index]]
        name = "pytorch-cu128"
        url = "https://download.pytorch.org/whl/cu128"
        explicit = true

        [tool.uv.sources]
        torch = { index = "pytorch-cu128" }
        ```

    2. 프로젝트 내부에 GPU용 PyTorch를 추가 및 설치한다
        > 이때 명령어는 `torch` 이지만, 실제로 설치되는건 일반 PyPI의 `torch`가 아니라 `pyporject.toml` 에서 정의하고 있는 **CUDA 12.8용 PyTorch wheel**

        ```bash
        uv init
        uv add torch
        uv run python main.py
        ```

> 교재의 경우 정말 GPU만 준비된 환경에서 시작하는 법을 알려주지만, 연구실 서버에서는 이미 NVIDIA Driver가 특정되어있고 모두 깔려있기 때문에 이미 환경이 설정되어있다.
>
> 따라서 연구자가 해당 서버에 해야하는 것은 uv 프로젝트 생성 이후 PyTorch Wheel (CUDA용 Wheel) 만 설치하는 것이다.
>
> - PyTorch Wheel : PyTorch를 설치하기 쉽게 미리 빌드해 둔 파이썬 패키지 파일
>
> ![Notion image](/notion-assets/study-record/3aa14b84a0f28061831dde142ca26814.png)
>
>

# Chapter 03 - 선형회귀분석


### `torch.nn.Linear` 는 무슨 의미인가?

    - `layer = torch.nn.Linear(3, 2)` 라고 할때 입력 특징 3개를 받아 출력 특징 2개를 만드는 단일 완전연결층.
    - `nn.Linear`의 가중치와 편향은 입력 특성 수에 따라 정해지는 균등분포에서 초기화된다
        > **기본 초기화 범위**

        `nn.Linear(in_features, out_features)`는 기본적으로 다음 범위에서 값을 뽑습니다.


        $[W,b\sim\mathcal U\left(\frac{1}{\sqrt{\text{number of input features}}},\frac{1}{\sqrt{\text{number of input features}}}\right)]$


        따라서 모델은 대략 다음과 같이 초기화됩니다.


        | 층               | 가중치 형태    | 초기화 범위                         |
        | --------------- | --------- | ------------------------------ |
        | `Linear(1, 6)`  | `(6, 1)`  | $([-1,1])$                     |
        | `Linear(6, 10)` | `(10, 6)` | $([-1/\sqrt6,1/\sqrt6])$       |
        | `Linear(10, 6)` | `(6, 10)` | $([-1/\sqrt{10},1/\sqrt{10}])$ |
        | `Linear(6, 1)`  | `(1, 6)`  | $([-1/\sqrt6,1/\sqrt6])$       |


### PyTorch에서 자주 사용하는 난수 분포


    → 교재에서는 `torch.nn.init.uniform_` 을 활용해서 X와 y데이터를 활용하지만 보통 `torch.nn.init.uniform_` 의 경우 샘플 데이터 생성 보다는 주로 모델의 신경망 파라미터 초기화에서 활용된다 [https://docs.pytorch.org/docs/2.13/nn.init.html](https://docs.pytorch.org/docs/2.13/nn.init.html)


    **1. 균등분포:** **`torch.rand`**


    ```plain text
    x=torch.rand(1000,1)
    ```


    $x \sim \mathcal{U}(0,1)$ 결과는 0 이상 1 미만


    범위를 바꾸려면 다음 공식을 사용


    ```plain text
    low=-10
    high=10
    x=low+ (high-low)*torch.rand(1000,1)
    ```


    주로 다음에 사용합니다.

    - 임의 좌표 생성
    - 확률값 생성
    - 데이터 증강 파라미터 선택
    - 간단한 가중치 초기화
    - 확률적 마스크 생성

    ---


    **2. 표준정규분포:** **`torch.randn`**


    ```plain text
    x=torch.randn(1000,1)
    ```


    $x \sim \mathcal{N}(0,1)$


    평균이 0이고 표준편차가 1인 정규분포. `torch.randn`은 지정한 형태의 표준정규분포 텐서를 생성


    ```plain text
    대부분의 값: -2 ~ 2
    0 주변 값이 많이 생성됨
    극단적으로 큰 값은 드물게 생성됨
    ```


    딥러닝에서 매우 자주 사용됩니다.

    - 가중치 초기화
    - 입력 데이터에 Gaussian noise 추가
    - VAE의 latent variable 샘플링
    - 확산 모델의 초기 noise 생성
    - 임의 테스트 데이터 생성

    평균과 표준편차를 바꾸려면 다음처럼 사용합니다.


    ```python
    mean=5
    std=2
    x=mean+std*torch.randn(1000,1)
    ```


    그러면 $x\sim\mathcal{N}(5,2^2)$입니다.


    ---


    **3. 일반 정규분포:** **`torch.normal`**


    평균과 표준편차를 직접 지정할 수 있습니다.


    ```plain text
    x=torch.normal(mean=5.0,std=2.0,size=(1000,1))
    ```


    또는 각 원소마다 서로 다른 평균과 표준편차를 적용할 수도 있습니다.


    ```plain text
    means=torch.tensor([0.0,5.0,10.0])
    stds=torch.tensor([1.0,2.0,0.5])
    x=torch.normal(means,stds)
    ```


    `torch.normal`은 지정된 평균과 표준편차를 갖는 정규분포에서 표본을 생성합니다.


    ---


    **4. 정수 균등분포:** **`torch.randint`**


    ```plain text
    x=torch.randint(low=0,high=10,size=(1000,1))
    ```


    가능한 값은 다음과 같습니다.


    ```plain text
    0, 1, 2, ..., 9
    ```


    `10`은 포함되지 않습니다.


    주로 다음에 사용합니다.

    - 임의 클래스 번호 생성
    - 임의 인덱스 선택
    - 데이터셋 샘플 선택
    - 정수 형태의 시뮬레이션
    - 임의 프레임 번호 선택

    ```plain text
    random_indices=torch.randint(0,len(dataset),(32,))
    ```


    ---


    **5. 베르누이 분포:** **`torch.bernoulli`**


    베르누이 분포는 결과가 `0` 또는 `1`인 분포입니다.


    ```python
    probabilities=torch.full((10,),0.7)
    samples=torch.bernoulli(probabilities)
    ```


    각 원소는 다음 확률을 갖습니다.


    $P(x=1)=0.7,\; P(x=0)=0.3$


    예상 출력:


    ```plain text
    tensor([1., 1., 0., 1., 1., 0., 1., 1., 1., 0.])
    ```


    PyTorch의 `torch.bernoulli`는 입력 텐서의 각 값을 해당 위치의 성공확률로 해석해 0 또는 1을 생성합니다.


    주요 활용:

    - Dropout 마스크
    - 데이터 일부 선택
    - 이진 사건 시뮬레이션
    - 이진 잠재변수
    - 확률적 augmentation 적용 여부

    예를 들어 50% 확률로 데이터 증강을 적용할 수 있습니다.


    ```plain text
    apply_augmentation=torch.bernoulli(torch.tensor(0.5))ifapply_augmentation.item()==1:print("augmentation 적용")
    ```


    ---


    **6. 범주분포:** **`torch.multinomial`** **또는** **`Categorical`**


    여러 클래스 중 하나를 확률에 따라 선택합니다.


    ```python
    probs=torch.tensor([0.1,0.3,0.6])
    sample=torch.multinomial(probs,num_samples=1)
    print(sample)
    ```


    각 클래스가 뽑힐 확률은 다음과 같습니다.


    ```plain text
    클래스 0: 10%
    클래스 1: 30%
    클래스 2: 60%
    ```


    활용 사례:

    - 언어 모델에서 다음 토큰 샘플링
    - 강화학습에서 행동 선택
    - 확률 기반 클래스 선택
    - 생성 모델의 범주형 출력

    `torch.distributions`를 사용하면 다음처럼 표현할 수도 있습니다.


    ```plain text
    from torch.distributions import Categorical
    dist=Categorical(probs=torch.tensor([0.1,0.3,0.6]))
    sample=dist.sample()
    print(sample)
    ```


    ---


### Optimizer 별 손실함수의 변화


     [https://wikidocs.net/194971](https://wikidocs.net/194971)


    | Optimizer                    | 특징                          |
    | ---------------------------- | --------------------------- |
    | Stochastic Gradient Descent  | 현재 기울기를 직접 사용               |
    | SGD + Momentum               | 현재 기울기를 직접 사용 + momentum 활용 |
    | Root Mean Square Propagation | 최근 기울기 제곱을 이용해 학습률 조절       |
    | Adaptive Moment Estimation   | Momentum과 RMSprop 방식을 결합    |

    1. SGD

        = `optimizer = optim.SGD(model.parameters(), lr=0.01)`

        > 각각의 파라미터에 대해 학습률(learning rate)을 곱한 값을 사용하여 가중치를 업데이트하는 방식
    2. SGD + Momentum

        = `optimizer = torch.optim.SGD(model.parameters(), lr=0.01, momentum=0.9)`

        > 모멘텀은 SGD의 변형인 모멘텀 최적화(Momentum Optimization)에서 사용되는 하이퍼파라미터로, 이전 그래디언트의 가중 평균을 사용하여 현재 그래디언트를 업데이트하는 방법
    3. RMSprop

        = `optimizer = torch.optim.RMSprop(model.parameters(),lr=0.01)`

        >
>
>         주로 순환 신경망(RNN)과 같이 긴 시퀀스 데이터를 다룰 때 사용. 경사(gradient)의 크기를 지수 이동 평균(exponential moving average)을 사용하여 조절하며, 경사의 크기에 따라 각각의 파라미터를 업데이트
>
>
    4. Adam

        = `optimizer = torch.optim.Adam(model.parameters(),lr=0.01)`

        > 현재 가장 널리 사용되는 옵티마이저로, 이전 그래디언트의 지수적인 이동 평균을 사용하여 학습률을 조절하는 방식으로 모델을 업데이트
>
>         → `L1Loss` (절댓값차)를 활용했기에 기울기는 오차의 크기보다 주로 **오차의 방향**에 의해 결정된다 + `L1loss`는 최적점에서 멀리 있을 떄의 기울기의 크기는 일정하다 (1 아니면 -1)
>
>
>         $\frac{∂e}{∂L}=+1 (e>0) \; | −1 (e<0)$
>
>
>         ![Notion image](/notion-assets/study-record/3ab14b84a0f280f5bc13d8518621556b.png)
>
>
>         → Adam은 기울기의 이동평균 $m_t$과 기울기 제곱의 이동평균 $v_t$을 사용 → 둘은 거의 비슷하기에 사실상 거의 학습률만큼 항상 균일하게 변화한다.
>
>
>             $θ_{t+1}=θ_t−α\frac{m^t}{v^t+ϵ}$
>
>
>         → 그래서 Adam으로 활용한 이건 처음에 선형적으로 감소한것.
>
>
>         한번 더 확인하기 위해 손실함수를 L2loss (`MSELoss` )로 바꾸면 모양이 비선형적으로 바뀐다.
>
>
>         ![Notion image](/notion-assets/study-record/3ab14b84a0f2807a9af5cca9b29cae3c.png)
>
>

![Notion image](/notion-assets/study-record/3ab14b84a0f2802589beea0b528601a9.png)


![Notion image](/notion-assets/study-record/3ab14b84a0f2807e93bac73b4877ec5c.png)


![Notion image](/notion-assets/study-record/3ab14b84a0f28012af22fefa63f31378.png)


![Notion image](/notion-assets/study-record/3ab14b84a0f280e3a072d5b8f23c9170.png)


# Chapter 04 - 인공신경망


## 인공신경망의 요소


### 활성화함수는 왜 존재해야 하는가?

    > 만약 활성화 함수 없이 가중치와 편차로만 여러 층을 쌓는다면 결국 y에 대한 일차함수만 된다 → 선형적 관계밖에 추론할 수 없게 된다
>
>     →하지만 중간에 ReLU와 같은 비선형 활성화함수를 넣게 된다면 해당 심층 신경망은 비선형적 관계 또한 추론할 수 있게 된다. **핵심은 비선형**
>
>
>     정리하면 활성화 함수는 **입력 신호를 비선형적으로 변환**하여, 신경망이 선형 회귀나 로지스틱 회귀와 같은 간단한 모델로는 해결할 수 없는 **복잡한 문제를 해결**할 수 있도록 한다. 또한, 활성화 함수는 신경망의 **각 층 사이에 비선형성을 도입**하여, 심층 신경망이 더 복잡한 데이터를 효과적으로 학습할 수 있게 한다.
>
>

    [https://wikidocs.net/250622](https://wikidocs.net/250622)


    ![Notion image](/notion-assets/study-record/3ab14b84a0f280fb9192fa945996732c.png)


    보통은 ReLU와 Sigmoid, 그리고 tanh가 activation function으로 많이 쓰인다. 특히 Sigmoid와 tanh은 모든 구간에서 미분이 가능하기 때문에 역전파를 하는데 유용하다.


## 전파와 역전파

- 전파 (순전파, forward propagation) : 인공 신경망에서 입력값이 들어오면 여러 개의 은닉층을 순서대로 거쳐 결괏값을 내는 과정 (→)
- 역전파 (backpropagation) : 결과와 정답의 차이로 계싼된 손실을 연쇄법칙을 이용하여 입력 단까지 다시 전달하는 과정

## 모델 구현


### 은닉층의 파라미터는 어떻게 설정하고 어떤 효과가 존재하는가?


    ```plain text
    model = nn.Sequential(
        nn.Linear(1, 6),
        nn.ReLU(),
        nn.Linear(6, 10),
        nn.ReLU(),
        nn.Linear(10, 6),
        nn.ReLU(),
        nn.Linear(6, 1),
    )
    ```


    1. 특성 수를 늘리면 무엇이 달라지는가


    **특성 수가 커질 때**

    - 모델이 **더 복잡한 관계**를 표현할 수 있습니다.
    - 학습할 파라미터가 많아집니다.
    - **연산량과 메모리 사용량이 증가**합니다.
    - 데이터가 부족하면 **과적합**될 가능성이 커집니다.
    - 지나치게 크다고 반드시 성능이 좋아지지는 않습니다.

    **특성 수가 작아질 때**

    - **모델이 단순**해집니다.
    - **학습과 추론이 빨라집니다.**
    - 과적합 위험이 줄어듭니다.
    - 너무 작으면 필요한 관계를 표현하지 못해 **과소적합**할 수 있습니다.

    결국 특성 수는 모델의 **표현 능력과 비용 사이의 조절 장치**


    ---


    `nn.Linear(in_features, out_features)`의 파라미터 수:


    $\text{파라미터 수}=\text{입력 특성 수}\times\text{출력 특성 수}+\text{출력 특성 수}$


    PyTorch에서 직접 확인 가능


    ```python
    num_parameters=sum(
								parameter.numel()
								for parameter in model.parameters())
    print(num_parameters)
    ```


    2. 특성 수가 적합하다는 것은 어떻게 알 수 있을까


    | 결과                  | 해석                 |
    | ------------------- | ------------------ |
    | 훈련·검증 손실 모두 높음      | 모델이 너무 작거나 학습이 부족함 |
    | 훈련 손실은 낮고 검증 손실은 높음 | 모델이 너무 크거나 과적합됨    |
    | 훈련·검증 손실 모두 낮음      | 적절한 모델일 가능성이 높음    |
    | 큰 모델과 작은 모델 성능이 비슷함 | 작은 모델을 선택하는 것이 효율적 |


    3. 이미지에서는 특성 수가 무엇인가


    이미지 모델에서도 같은 개념이 사용되지만, 일반적으로 Linear의 뉴런 수보다는 **채널 수**


    일반적인 RGB 이미지의 형태 : **`[배치 크기, 채널, 높이, 너비]`**


    예를 들어 32장의 RGB 이미지가 있고 크기가 224×224라면 다음과 같습니다.


    `x.shape # torch.Size([32, 3, 224, 224])`


    4. 실제 연구에서는 특성 수는 어떻게 다루는가?


    실제 연구나 프로젝트에서는 모든 채널 수를 처음부터 직접 설계하기보다 **검증된 모델**을 사용합니다.


    예를 들면 다음과 같습니다.

    - ResNet
    - EfficientNet
    - ConvNeXt
    - Vision Transformer
    - Swin Transformer

    이 모델들은 논문에서 **검증된 특성 수와 층 구조**를 이미 가지고 있습니다. 사용자는 주로 모델 크기 버전을 선택합니다

    - Tiny
    - Small
    - Base
    - Large

# Chapter 05 - 합성곱 신경망


## 합성곱 연산 과정

- 활성화 지도 (Activation map) or 특성 지도 (feature map)

    : 필터 하나당 입력 이미지 전체에 대한 필터의 일치 정도

    - 활성화 지도의 크기 $O$는 입력 이미지 $I$와 필터의 크기 $K$, 스트라이드 크기 $S$에 따라 결정된다.

        $O  =floor(\frac{I-K}{S}+1)$


### ReLU함수의 종류와 장단점


    ![Notion image](/notion-assets/study-record/3ad14b84a0f28012bd63d0f2acd90468.png)


    | 활성화 함수     | 음수 입력 처리  | 음수 영역 기울기      | 주요 특징                   |
    | ---------- | --------- | -------------- | ----------------------- |
    | ReLU       | 0으로 만듦    | 0              | 간단하고 빠르지만 Dying ReLU 가능 |
    | Leaky ReLU | 작은 음수로 출력 | 고정된 ($\alpha$) | 죽은 뉴런 문제 완화             |
    | RReLU      | 작은 음수로 출력 | 무작위 ($\alpha$) | 죽은 뉴런 완화와 정규화 효과        |
    | 평가 시 RReLU | 작은 음수로 출력 | 범위의 평균값        | 추론 결과를 안정적으로 유지         |


    **1. ReLU (**`activation = nn.ReLU()`)


    ReLU(Rectified Linear Unit)는 입력이 양수이면 그대로 출력하고, 음수이면 0을 출력합니다.


    $f(x)=\max(0,x)=\begin{cases}
    x & x>0\\0 & x\leq0\end{cases}$


    **장점**

        - 계산이 매우 간단하고 빠릅니다.
        - 양수 영역의 기울기가 1이므로 sigmoid나 tanh보다 기울기 소실 문제가 적습니다.
        - 음수 입력을 0으로 만들기 때문에 일부 뉴런만 활성화되는 희소한 표현을 만들 수 있습니다.
        - MLP와 CNN에서 기본적인 활성화 함수로 널리 사용됩니다.

    **단점: Dying ReLU**


        입력이 음수이면 출력과 기울기가 모두 0입니다.
        $x<0 \Rightarrow f(x)=0,\quad f'(x)=0$


        학습 과정에서 어떤 뉴런의 입력이 계속 음수가 되면 해당 뉴런의 가중치가 더 이상 업데이트되지 않을 수 있습니다. 이를 **Dying ReLU** 또는 **죽은 뉴런 문제**라고 합니다.


        특히 다음 조건에서 발생하기 쉽습니다.

        - 학습률이 너무 큰 경우
        - 가중치 초기화가 적절하지 않은 경우
        - 입력값의 분포가 음수 방향으로 크게 이동한 경우

    ---


    **2. Leaky ReLU (`activation = nn.LeakyReLU(negative_slope=0.01)`)**


    Leaky ReLU는 음수 입력을 완전히 0으로 만들지 않고, 작은 기울기를 곱해 출력합니다.


    $f(x)=\begin{cases}x & x>0\\\alpha x & x\leq0\end{cases}$


    여기서 $\alpha$는 일반적으로 `0.01`과 같은 작은 값입니다.


    예를 들어 $\alpha=0.01$일 때 다음과 같이 계산됩니다.


    | 입력 $x$ | ReLU | Leaky ReLU |
    | ------ | ---- | ---------- |
    | 3      | 3    | 3          |
    | 0      | 0    | 0          |
    | -2     | 0    | -0.02      |
    | -10    | 0    | -0.1       |


    **장점**

        - 음수 영역에서도 기울기가 $\alpha$만큼 존재합니다.
        - Dying ReLU 문제가 완화됩니다.
        - 음수 입력에 포함된 정보를 완전히 제거하지 않습니다.
        - ReLU와 마찬가지로 계산량이 적습니다.

    **단점**

        - 음수 영역의 기울기 $\alpha$를 직접 설정해야 합니다.
        - $\alpha$가 너무 작으면 ReLU와 거의 차이가 없어집니다.
        - $\alpha$가 너무 크면 비선형성이 약해질 수 있습니다.
        - 모든 문제에서 ReLU보다 성능이 좋은 것은 아닙니다.

    일반적으로 다음 정도에서 시작할 수 있습니다.


    하지만 `0.01`, `0.1`, `0.2` 등을 하이퍼파라미터로 비교할 수 있습니다.


    ---


    **3. Randomized Leaky ReLU (`activation = nn.RReLU(lower=0.125, upper=0.333)`)**


    Randomized Leaky ReLU는 보통 **RReLU**라고 부릅니다. Leaky ReLU와 구조는 같지만, 음수 영역의 기울기 $\alpha$를 고정하지 않고 일정 범위에서 무작위로 선택합니다.


    $f(x)=\begin{cases}x & x>0\\\alpha x & x\leq0\end{cases},\qquad\alpha\sim U(l,u)$


    여기서 $U(l,u)$는 $I$과 $u$ 사이의 균등분포입니다.


    PyTorch에서는 다음과 같이 사용합니다.


    학습할 때는 음수 영역의 기울기가 지정된 범위에서 무작위로 선택됩니다.


    ```plain text
    0.125 ≤ α ≤ 0.333
    ```


    평가 시에는 일반적으로 두 경곗값의 평균을 사용합니다. $\alpha=\frac{l+u}{2}$


    **장점**

        - Dying ReLU 문제를 완화합니다.
        - 학습 중 무작위성이 추가되어 정규화 효과를 낼 수 있습니다.
        - 모델이 특정한 음수 기울기에 지나치게 의존하는 것을 방지할 수 있습니다.
        - 데이터가 적을 때 과적합을 줄이는 데 도움이 될 가능성이 있습니다.

    **단점**

    - 학습할 때마다 기울기가 달라지므로 결과 재현이 더 어려울 수 있습니다.
        - Leaky ReLU보다 동작을 직관적으로 해석하기 어렵습니다.
        - `lower`, `upper` 범위를 추가로 결정해야 합니다.
        - 최근 일반적인 모델에서는 ReLU, Leaky ReLU, GELU, SiLU보다 사용 빈도가 낮습니다.
        - 무작위성이 반드시 성능 향상으로 이어지는 것은 아닙니다.

## 패딩과 풀링


![Notion image](/notion-assets/study-record/3ad14b84a0f280cd9ee5e227b17cf627.png)

- **Padding** 은 일정한 크기의 층으로 이미지를 감싸는 것을 의미하는데, 이는 합성곱으로 인한 이미지의 크기 **감소를 방지(활성화 지도의 크기 증가)**할 수 있다 따라서 위의 활성화 지도에 대한 식을 패딩 크기를 반영해서 고칠 수 있다

    $O  =floor(\frac{I-K+2P}{S}+1)$

- **Pooling**은 Downsampling 혹은 subsampling의 일종으로 합성곱 신경망에서는 크게 최댓값만을 전달하고 다른 정보는 버리는 max pooling과 일정 크기의 구간 내의 값들의 평균을 전달하는 average pooling이 존재한다 **(활성화 지도의 크기 감소)**
    - max pooling :  일정 구간에서 해당 필터의 모양과 가장 비슷한 부분을 전달하는 연산
    - average pooling : 일해당 필터의 모양과 평균적으로 얼마나 일치하는지를 뽑아낸다
    - 전체 크기를 줄여주거나 연산을 마친후 마지막에 클래스별 확률로 도출할 때 사용

## 소프트맥스 함수

- 교차 엔트로피에서 KLD항의 의미

    정답 분포 $P$, 예측 분포 $Q$에 대한 교차엔트로피:  $H(P,Q)=−k∑P(k)logQ(k)$


    이 값은 다음 두 항으로 분해 가능


    $\boxed{H(P,Q)=H(P)+D_{\mathrm{KL}}(P\|Q)}$


    이때 $D_{KL}$이 바로 Kullback-Leibler Divergence항이다

    > 모델이 예측한 확률분포가 정답 확률분포에서 얼마나 벗어났는지를 수치화 → 유사할수록 KLD는 감소한다.
>
>     $D_{\mathrm{KL}}(P\|Q)=\sum_k P(k)\log\frac{P(k)}{Q(k)}$
>
>
    - 예측이 잘못될 수록 L1 손실(선형적으로 증가)보다 더 크게 증가하기에 더 페널티가 크고 손실 값이 크다.

## 유명한 모델들과 원리


### VGCNet


[https://arxiv.org/abs/1409.1556](https://arxiv.org/abs/1409.1556)


### GoogLeNet


[https://arxiv.org/abs/1409.4842v1](https://arxiv.org/abs/1409.4842v1)


## ResNet


[https://arxiv.org/abs/1512.03385](https://arxiv.org/abs/1512.03385)b


![Notion image](/notion-assets/study-record/3ad14b84a0f2801faf69e1c2e3985246.png)


Bottleneck Block이란 무엇인가?

    > 채널 수를 잠시 줄인 상태에서 합성곱 연산을 수행한 뒤, 다시 채널 수를 늘리는 잔차 블록
>
>     **ResNet-50, ResNet-101, ResNet-152**처럼 깊은 ResNet에서 사용됩니다.
>
>
>     입력→1×1 Conv→3×3 Conv→1×1 Conv→출력
>
>
>     핵심 구조는 다음과 같습니다.
>
>
>     | 순서 | 연산       | 역할            |
>     | -- | -------- | ------------- |
>     | 1  | 1×1 Conv | 채널 수 감소       |
>     | 2  | 3×3 Conv | 공간적 특징 추출     |
>     | 3  | 1×1 Conv | 채널 수 복원 또는 확장 |
>
>
>     이 연산 결과에 입력을 더합니다. $y=F(x)+x$
>
>
>     여기서 $F(x)$가 세 개의 합성곱 층을 통과한 결과이고, $x$는 shortcut 경로를 통과한 입력
>
>

    | 구분      | Basic Block              | Bottleneck Block                     |
    | ------- | ------------------------ | ------------------------------------ |
    | 합성곱 층 수 | 2개                       | 3개                                   |
    | 구조      | ($3\times3$, $3\times3$) | ($1\times1$, $3\times3$, $1\times1$) |
    | 사용 모델   | ResNet-18, 34            | ResNet-50, 101, 152                  |
    | 주요 목적   | 비교적 단순한 잔차 학습            | 깊은 모델의 계산량 절감                        |
    | 채널 변화   | 대체로 유지                   | 감소 후 확장                              |


    ---


    **보틀넥 블록의 장점**

    1. **계산량과 파라미터 수를 줄입니다.**

        : 비싼 3×3 합성곱을 낮은 채널 차원에서 수행합니다.

    2. **더 깊은 네트워크를 만들 수 있습니다.**

        : 계산량을 억제하면서 블록당 합성곱 층을 3개씩 쌓을 수 있습니다.

    3. **잔차 연결로 기울기 전달이 쉬워집니다.**

        : 입력이 shortcut을 통해 뒤쪽 층으로 직접 전달됩니다.

    4. **채널 간 정보를 학습할 수 있습니다.**

        : 1×1 합성곱이 서로 다른 채널을 선형적으로 조합합니다


    **단점**

    1. 작은 모델에서는 구조가 지나치게 복잡할 수 있습니다.
    2. 채널을 너무 많이 압축하면 중요한 정보가 손실될 수 있습니다.
    3. 1×1 합성곱을 추가하므로 층 구조 자체는 Basic Block보다 복잡합니다.
    4. 아주 작은 네트워크에서는 Basic Block이 더 효율적일 수 있습니다.

# Chapter 06 - RNN


## 발달 과정과 작동 원리


![Notion image](/notion-assets/study-record/3ad14b84a0f28047877bf219a6a65d6d.png)


![Notion image](/notion-assets/study-record/3ad14b84a0f28077aea1f029bf69d634.png)


### Sequential data와 Time series data의 차이


    **Sequential data(순차 데이터)**는 관측값의 **순서가 중요한 데이터 전체**


    **Time series data(시계열 데이터)**는 순차 데이터 중에서도 각 관측값이 **시간과 연결된 데이터**


    $\boxed{\text{Time Series Data} \subset \text{Sequential Data}}$.


    | 구분           | Sequential data         | Time series data     |
    | ------------ | ----------------------- | -------------------- |
    | 핵심 기준        | 데이터의 순서                 | 시간에 따른 변화            |
    | 각 데이터의 인덱스   | 위치 또는 순서                | 시각 또는 시간 간격          |
    | 시간 간격의 의미    | 없어도 됨                   | 일반적으로 중요함            |
    | 순서를 바꿀 수 있는가 | 바꾸면 의미가 달라짐             | 바꾸면 시간적 구조가 깨짐       |
    | 대표 예시        | 문장, DNA, 클릭 순서, 비디오 프레임 | 주가, 기온, 센서값, 월별 매출   |
    | 주요 분석 대상     | 앞뒤 요소 간 관계              | 추세, 계절성, 자기상관, 시간 지연 |


## 모델 구현


예시 문장 :
`hello pytorch. how long can a rnn cell remember? show me your limit!`


| 하이퍼파라미터                               | print(output_string)                                                 | 정답 문자열 수 |  정답률 |
| ------------------------------------- | -------------------------------------------------------------------- | --------------- |
| n_hidden = 35
lr = 0.01
epochs = 1000 | hello pytorch lho eotell lono. .ome ynnlge conem .ypy.y.h.y.ycycycyc | 13 | 19%        |
| n_hidden = 52
lr = 0.01
epochs = 1000 | hello pytorch. how long can a rnn cell remember? show me your limit! | 68 | 100%       |
| n_hidden = 70
lr = 0.01
epochs = 1000 | hello pytorch. how long can a rnn cell remember? show me your limit! | 68 | 100%       |


![Notion image](/notion-assets/study-record/3b014b84a0f280e7996fc2cf5e02118a.png)

> 대략 hidden layer의 수가 50을 넘어갈때부터 68개의 character로 이루어진 문장은 거의 완벽하게 (중간에 잠깐 성능 감소가 있음) 예측한다
> - 초록 라인은 증감하는 # of correct answers 의 변화 정도를 보여준다.
>

# Chapter 07 - 학습시 생길 수 있는 문제점과 해결 방안


## 드롭아웃


### Fully Connected Network(완전연결 신경망)이란 무엇인가?

    - 완전연결이란?
        - 은닉층에서 개별 뉴런이 이전의 모든 뉴런의 출력값을 받는다

            e.g. `layer = nn.Linear(in_features=3, out_features=4)`

            > 입력 특성 3개를 받아 출력 특성 4개를 만드는 완전 연결층 생성 코드
    - Fully Connected Network

        : 여러 개의 완전연결층을 쌓아 만든 전체 신경망


        ```python
        model = nn.Sequential(
            nn.Linear(10, 32),
            nn.ReLU(),
            nn.Linear(32, 16),
            nn.ReLU(),
            nn.Linear(16, 3)
        )
        ```

    - 완전 연결 신경망은 이해하기 쉽고 구조가 단순하다. 또한 표와 같은 테이블 데이터에 강점이 있다.
    - 하지만 연산해야하는 파라미터 수가 많고 이미지의 공간 구조를 사용하지 못한다 (이미지가 평탄화, flatten되기 때문)는 점이 있다 → CNN이 강점

## 데이터 증강


### 데이터 증강의 기본 유형

    > 이때 기준은 `torchvision` 에서 제공하는 기본 함수를 의미한다. 굉장히 많기에 교재에서 언급한 항목만 정리하였다
>
>     [https://docs.pytorch.org/vision/0.21/transforms.html](https://docs.pytorch.org/vision/0.21/transforms.html)
>
>
>     ImageFolder 함수에 넣어 사용 가능하다.
>
>
    - `ToTensor`
    - `ToPILImage`
    - `Normalize`
    - `Resize`
    - `Scale`
    - `CenterCrop`
    - `Pad`
    - `Lambda` : Image Data Augmentation을 직접 함수로 선언하여 커스텀할 수도 있다.
    - `RandomCrop`
    - `RandomHorizontalFlip`
    - `RandomVerticalFlip`

# Chapter 09 - 오토인코더

> 데이터에 대한 효율적인 압축을 신경망을 통해 자동으로 학습하는 모델. 일반적으로 입력 데이터 자체가 라벨로 사용되기 때문에 비지도 학습에 속한다
> - `efficient data encoding`, `feature learning`, `representation learning` , `dimensionality reduction`
>

![Notion image](/notion-assets/study-record/3b014b84a0f280368426db12f9482b9d.png)


### AutoEncoder가 왜 필요한가?


    **많은 경우에는 학습할 때 인코더와 디코더를 함께 사용하고,**
    **학습이 끝난 뒤에는 목적에 따라 인코더만 사용하기도 한다.**


    1. 오토인코더의 기본 구조


    오토인코더는 입력를 다음과 같이 처리한다


    $x \xrightarrow{\text{Encoder}} z \xrightarrow{\text{Decoder}} \hat{x}$

    - $x$: 원본 입력
    - $z$: 인코더가 만든 압축된 표현, 즉 **잠재 벡터(latent vector)**
    - $\hat{x}$: 디코더가 복원한 입력

    2. 학습할 때는 디코딩 결과로 손실을 계산


    즉, 복원 결과 $\hat{x}$가 원본 $x$와 얼마나 다른지를 측정 $L = \|x-\hat{x}\|^2$


    이미지에서는 대표적으로 다음 손실을 사용

    - MSELoss: 픽셀값의 차이
    - BCELoss: 픽셀값을 0~1 확률처럼 다루는 경우
    - L1Loss: 절댓값 차이

    이 손실은 디코더뿐만 아니라 인코더까지 역전파


    ```plain text
    원본과 복원 결과의 차이
            ↓
    Decoder 가중치 수정
            ↓
    Encoder 가중치도 수정
    ```


    따라서 인코더는 단순히 입력을 줄이는 것이 아니라, **디코더가 원본을 복원할 수 있도록 중요한 정보를** $z$**에 담는 방향으로 학습**


    3. 학습 후 무엇을 사용하는지

    > **특징 추출이나 사전학습**
>
>     **: 이미지 → Encoder → 특징 벡터 → 분류기**
>
>
>     **: 인코더만 사용**
>
>
    > **차원 축소와 데이터 시각화**
>
>     **: 고차원 데이터 → Encoder → 2차원 또는 3차원 latent vector**
>
>
>     : **인코더만 사용**
>
>
    > **이상 탐지**
>
>     **: 정상 입력 → 복원 잘됨 → 복원 오차 작음
>     : 이상 입력 → 복원 잘 안 됨 → 복원 오차 큼**
>
>
>     이 경우에는 **인코더와 디코더를 모두 사용**
>
>
>     $\text{Anomaly Score} = \|x-\hat{x}\|$
>
>
    > **노이즈 제거  (Denoising Autoencoder)**
>
>     **: 노이즈가 있는 이미지 → Encoder → Decoder → 깨끗한 이미지**
>
>
>     전체 구조를 사용
>
>

    3. PyTorch 구현 방식


    ```python
    import torch
    import torch.nn as nn


    class AutoEncoder(nn.Module):
        def __init__(self):
            super().__init__()

            self.encoder = nn.Sequential(
                nn.Linear(784, 128),
                nn.ReLU(),
                nn.Linear(128, 32),
            )

            self.decoder = nn.Sequential(
                nn.Linear(32, 128),
                nn.ReLU(),
                nn.Linear(128, 784),
                nn.Sigmoid(),
            )

        def forward(self, x):
            z = self.encoder(x)
            reconstructed = self.decoder(z)
            return reconstructed
    ```


## 합성곱 오토인코더

>
>
> Encoder: 픽셀 → 여러 종류의 특징
>
>
> Decoder: 여러 종류의 특징 → 픽셀
>
>

### 왜 해상도를 줄이면서 채널을 늘리는가?


    공간 크기가 작아지면 **위치에 대한 세부 정보**는 줄어든다. 이를 보완하면서 **더 복잡한 정보를 표현**하기 위해 채널 수를 늘린다.

    1. 초기 층 : 정확한 픽셀 위치 중심의 표현
        - 공간 정보 많음
        - 특징 종류 적음
    2. 깊은 층 : 특징의 종류와 의미 중심의 표현
        - 공간 정보 적음
        - 특징 종류 많음

    예를 들어 숫자 `8`을 처리한다면 초기 층은 선과 경계를 감지하고, 깊은 층은 원형 구조나 위아래 구멍과 같은 복합 특징을 표현할 수 있다.

    > 하지만 총 원소수 자체는 오히려 증가한다

    입력 원소 수 = 1×28×28=7841


    마지막 특징 맵의 원소 수 = 256×7×7=12, ⁣544

    > 공간 해상도는 줄였지만, 채널이 크게 증가했기 때문에 **데이터를 작은 벡터로 압축했다기보다는** **풍부한 특징 표현으로 변환한 것**
    > 합성곱 인코더는 일반적으로 특징 맵의 높이와 너비를 줄여 공간 정보를 요약하고, 채널 수를 늘려 더 다양하고 추상적인 특징을 표현
>
>     다만 채널 증가가 크면 전체 원소 수는 오히려 증가할 수 있으므로, 공간 크기 감소가 곧 전체 차원의 압축을 의미하는 것은 아니다
>
>

## 시멘틱 세그멘테이션

> Autoencoder는 variational autoencoder (VAE) 나 semantic segmentation 사례로 활용된다
>
> VAE : latent variable이 어떻게 분포하는지, 어떤 값이 바꾸미에 따라 결과가 얼마나 바뀌는지 알 수 없기에 이 잠재 변수 공간을 친숙한 정규분포 공간으로 강제로 맞춰주는 방법
>
>
> Semantic Segmentation : 항공사진을 통해 단순화된 지도 이미지를 생성하는 것처럼 정보를 추상화 해서 의미에 맞게 분할한다.
>
>

### U-Net이란 무엇인가?


    [https://wikidocs.net/148870](https://wikidocs.net/148870)


    ![Notion image](/notion-assets/study-record/3b014b84a0f280ae910aec9b4abd69a9.png)

    1. 인코더(Contract path)의 피처맵을 디코더 피처맵에 Concat하여 위치 정보전달
    2. 데이터셋의 전처리, 변형(deformation)을 이용하여 데이터 수 증가
    3. 테두리(border line)를 더 잘 분할하기 위해 Weight를 추가한 손실함수(Loss function)

    UNET은 3부분으로 나누어 볼 수 있습니다.


    일반적으로 Semantic Segmentation 모델들은 **Down-sampling**을 통해 크기가 줄어들었다가 다시 **Up-sampling**을 통해 크기가 늘어나는 구조를 취하는데, U-Net 논문에서는 이를 각각 **Contracting Path, Expanding Path**라고 부릅니다.

    1. **Contracting Path**: 점진적으로 넓은 범위의 이미지 픽셀을 보며 **의미정보(Context Information)**을 추출
    2. **Bottle Neck**: **수축 경로에서 확장 경로로 전환되는 전환** 구간
    3. **Expanding Path**: 의미정보를 **픽셀 위치정보와 결합(Localization)**하여 각 픽셀마다 어떤 객체에 속하는지를 구분

    ![Notion image](/notion-assets/study-record/3b014b84a0f280919d72dbf410e9bd99.png)


    ![Notion image](/notion-assets/study-record/3b014b84a0f280faa213df1ea673a746.png)


    ### **Skip Architecture**


    ![Notion image](/notion-assets/study-record/3b014b84a0f280cb8f50c7e50f42ad52.jpg)


    U-Net에서도 FCN과 비슷하게 Skip Architecture를 활용하였습니다.


    : **채널 방향으로 이어 붙이는 Concatenation 방식**


# Chapter 10 - 생성적 적대 신경망 (Generative adversarial networkl, GAN)


[https://www.ibm.com/kr-ko/think/topics/generative-adversarial-networks](https://www.ibm.com/kr-ko/think/topics/generative-adversarial-networks)


[https://arxiv.org/abs/1511.06434](https://arxiv.org/abs/1511.06434)


[https://arxiv.org/abs/1609.04802](https://arxiv.org/abs/1609.04802)


[https://arxiv.org/abs/1703.10593](https://arxiv.org/abs/1703.10593)


![Notion image](/notion-assets/study-record/3b014b84a0f280cf9f05f0d50a77a886.png)

- Generator, 생성자는 어떠한 입력 (Random Input)을 받아서 가짜 데이터를 생성한다
- Discriminator는 실재 데이터와 가짜 데이터를 받아서 각각이 진짜인지 가짜인지 평가한다

### 목적함수

    - G는 생성자, D는 구분자, x는 데이터, z는 랜덤 노이즈, x~$P_{data}(x)$는 x를 data의 분포에서 샘플링GAN의 목적함수는 다음과 같습니다.

    $\min_G \max_D V(D,G)=\mathbb{E}_{x\sim P_{\text{data}}(x)}[\log D(x)]+\mathbb{E}_{z\sim P_z(z)}[\log(1-D(G(z)))]$


    판별자와 생성자의 목표

    1. **판별자** $D$ **:** 판별자는 전체 목적함수를 **최대화**

        $\max_D\left[\log D(x)+\log(1-D(G(z)))\right]$


        $D(x)\rightarrow1,\qquad D(G(z))\rightarrow0$

    2. **생성자** $G$ **:** 생성자는 전체 목적함수를 **최소화**

        $\min_G\mathbb{E}_{z\sim P_z}[\log(1-D(G(z)))]$

        > 생성자가 실제 데이터 x를 직접 사용 X
>
>         생성자는 판별자의 평가를 통해 간접적으로 실제 데이터의 특징을 학습
>
>

        $D(G(z))\rightarrow1$ (판별자가 생성 데이터를 실제 데이터로 착각하게 만드는 것)


        → 실제 데이터 분포와 생성된 데이터 분포의 Jensen-Shannon Divergence를 최소화하는 것


    전체 학습 과정

    1. 실제 데이터 x를 데이터셋에서 샘플링합니다.
    2. 랜덤 노이즈 z를 샘플링합니다.
    3. 생성자가 G(z)를 만듭니다.
    4. 판별자는 x와 G(z)를 구분하도록 학습합니다.
    5. 생성자는 판별자를 속이도록 학습합니다.
    6. 두 모델의 학습을 번갈아 반복합니다.
- 잠재 공간 보간 (latent space interpolation)

    : 잠재 변수 z의 공간을 탐색하기 위해 다른 값들은 고정하고 하나의 값만 연속적으로 바꿔보면서 결과가 어떻게 변하는지 관찰하는 방법론

-
