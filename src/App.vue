<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Card from './components/card.vue'
import { useGame } from './core/useGame'
import { basicCannon, schoolPride } from './core/utils'

const containerRef = ref<HTMLElement | undefined>()
const clickAudioRef = ref<HTMLAudioElement | undefined>()
const dropAudioRef = ref<HTMLAudioElement | undefined>()
const winAudioRef = ref<HTMLAudioElement | undefined>()
const loseAudioRef = ref<HTMLAudioElement | undefined>()
const welAudioRef = ref<HTMLAudioElement | undefined>()
const curLevel = ref(1)
const showTip = ref(false)
const LevelConfig = [
  { cardNum: 5, layerNum: 2, trap: false },
  { cardNum: 10, layerNum: 3, trap: false },
  { cardNum: 15, layerNum: 3, trap: false },
]

const isWin = ref(false)

const {
  nodes,
  selectedNodes,
  handleSelect,
  handleBack,
  backFlag,
  handleRemove,
  removeFlag,
  removeList,
  handleSelectRemove,
  handleAddSlot,
  addSlotFlag,
  initData,
} = useGame({
  container: containerRef,
  cardNum: 15,
  layerNum: 3,
  trap: false,
  events: {
    clickCallback: handleClickCard,
    dropCallback: handleDropCard,
    winCallback: handleWin,
    loseCallback: handleLose,
  },
})

function handleClickCard() {
  if (clickAudioRef.value?.paused) {
    clickAudioRef.value.play()
  }
  else if (clickAudioRef.value) {
    clickAudioRef.value.load()
    clickAudioRef.value.play()
  }
}

function handleDropCard() {
  dropAudioRef.value?.play()
}

function handleWin() {
  winAudioRef.value?.play()
  // fireworks()
  if (curLevel.value < LevelConfig.length) {
    basicCannon()
    showTip.value = true
    setTimeout(() => {
      showTip.value = false
    }, 1500)
    setTimeout(() => {
      initData(LevelConfig[curLevel.value])
      curLevel.value++
    }, 2000)
  }
  else {
    isWin.value = true
    schoolPride()
  }
}

function handleLose() {
  loseAudioRef.value?.play()
  setTimeout(() => {
    alert('已被崩坏侵蚀，堕入轮回~')
    // window.location.reload()
    nodes.value = []
    removeList.value = []
    selectedNodes.value = []
    welAudioRef.value?.play()
    curLevel.value = 0
    showTip.value = true
    setTimeout(() => {
      showTip.value = false
    }, 1500)
    setTimeout(() => {
      initData(LevelConfig[curLevel.value])
      curLevel.value++
    }, 2000)
  }, 500)
}

onMounted(() => {
  initData()
})
</script>

<template>
  <div flex flex-col w-full h-full>
    <span text-44px text-center w-full color="#000" fw-600 h-60px flex items-center justify-center mt-30px>
      崩了个崩
    </span>
    <div ref="containerRef" flex-1 flex>
      <div w-full relative flex-1>
        <template v-for="item in nodes" :key="item.id">
          <transition name="slide-fade">
            <Card
              v-if="[0, 1].includes(item.state)"
              :node="item"
              @click-card="handleSelect"
            />
          </transition>
        </template>
      </div>
      <transition name="bounce">
        <div v-if="isWin" color="#000" flex items-center justify-center w-full text-28px fw-bold>
          成功战胜崩坏！
        </div>
      </transition>
      <transition name="bounce">
        <div v-if="showTip" color="#000" flex items-center justify-center w-full text-28px fw-bold>
          第{{ curLevel + 1 }}关
        </div>
      </transition>
    </div>

    <div text-center h-50px flex items-center justify-center>
      <Card
        v-for="item in removeList" :key="item.id" :node="item"
        is-dock
        @click-card="handleSelectRemove"
      />
    </div>
    <div w-full flex items-center justify-center>
      <div class="card-slot" w-365px h-54px flex>
        <template v-for="item in selectedNodes" :key="item.id">
          <transition name="bounce">
            <Card
              v-if="item.state === 2"
              :node="item"
              is-dock
            />
          </transition>
        </template>
      </div>
    </div>

    <div h-50px flex items-center w-full justify-center mb-40px mt-20px>
      <button class="option-button" :disabled="removeFlag" mr-10px @click="handleRemove">
        移出前三个
      </button>
      <button class="option-button" :disabled="backFlag" mr-10px @click="handleBack">
        回退
      </button>
      <!-- <button class="option-button" :disabled="addSlotFlag" @click="handleAddSlot">
        增加卡槽
      </button> -->
    </div>
    <!-- <div w-full color="#000" fw-600 text-center pb-10px>
      <span mr-20px>designer: Teacher Face</span>
      by: Xc
      <a
        class="icon-btn"
        color="#000"
        i-carbon-logo-github
        rel="noreferrer"
        href="https://github.com/chenxch"
        target="_blank"
        title="GitHub"
      />
      <span
        text-12px
        color="#00000018"
      >
        <span
          class="icon-btn"
          text-2
          i-carbon:arrow-up-left
        />
        star buff</span>
    </div> -->
    <audio
      ref="clickAudioRef"
      style="display: none;"
      controls
      src="./audio/click.mp3"
    />
    <audio
      ref="dropAudioRef"
      style="display: none;"
      controls
      src="./audio/drop.mp3"
    />
    <audio
      ref="winAudioRef"
      style="display: none;"
      controls
      src="./audio/win.mp3"
    />
    <audio
      ref="loseAudioRef"
      style="display: none;"
      controls
      src="./audio/lose.mp3"
    />
    <audio
      ref="welAudioRef"
      style="display: none;"
      controls
      src="./audio/welcome.mp3"
    />
  </div>
</template>


<style>
.card-slot {
  position: relative;
  /* border: 4px solid #000; */
}
.card-slot::after {
  /* border-bottom: 4px solid #000; */
  position: absolute;
  content: '';
  background-image: url('assets/card-slot.webp');
  background-size: cover;
  top: 25px;
  width: 100%;
  height: 100%;
}
.option-button {
  background-color: #ffe14c;
  color: #663c00;
  font-weight: 600px;
}
body{
  background-image: url('assets/bg.webp');
  background-size: cover;
}

.bounce-enter-active {
  animation: bounce-in 0.5s;
}
.bounce-leave-active {
  animation: bounce-in 0.5s reverse;
}
@keyframes bounce-in {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.25);
  }
  100% {
    transform: scale(1);
  }
}

.slide-fade-enter-active {
  transition: all 0.2s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(25vh);
  opacity: 0;
}

.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
