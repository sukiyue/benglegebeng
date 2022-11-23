import { ref } from 'vue'
import { ceil, floor, random, shuffle } from 'lodash-es'
const defaultGameConfig: GameConfig = {
  cardNum: 4, // card类型数量，初始化为4，即第一关的只有四个卡种
  layerNum: 2, // 卡种倍数，初始化为2，即每种卡有2对
  trap: true, // 是否开启陷阱
  delNode: false, // 是否从nodes中剔除已选节点
}

export function useGame(config: GameConfig): Game {
  const { container, delNode, events = {}, ...initConfig } = { ...defaultGameConfig, ...config }
  const histroyList = ref<CardNode[]>([])
  const backFlag = ref(false)
  const removeFlag = ref(false)
  const removeList = ref<CardNode[]>([])
  const preNode = ref<CardNode | null>(null)
  const nodes = ref<CardNode[]>([])
  const indexSet = new Set()
  let perFloorNodes: CardNode[] = []
  const selectedNodes = ref<CardNode[]>([])
  const cardSlotLength = ref<Number>(7) // 卡槽长度
  const size = 52
  let floorList: number[][] = []
  const addSlotFlag = ref(false)

  // 更新所有卡片节点状态，更新节点状态
  // 当前节点所有父节点 state 均大于 0 时，设置当前节点 state 为 1，即可点击
  function updateState() {
    nodes.value.forEach((o) => {
      o.state = o.parents.every(p => p.state > 0) ? 1 : 0
    })
  }

  // 卡片节点点击
  function handleSelect(node: CardNode) {
    // 判断卡槽列表是否已满，若已满则不再处理点击事件
    if (selectedNodes.value.length === cardSlotLength.value)
      return
    // 设置点击的节点状态为 已选择
    node.state = 2
    // 历史列表存入点击节点，用于回退功能
    histroyList.value.push(node)

    preNode.value = node
    // 获取当前节点的索引值
    const index = nodes.value.findIndex(o => o.id === node.id)
    // 查询到索引值后，在nodes列表中删除当前节点，模拟将点击节点移动到卡槽
    if (index > -1)
      delNode && nodes.value.splice(index, 1)

    // 判断卡槽中是否有可以消除的节点
    const selectedSomeNode = selectedNodes.value.filter(s => s.type === node.type)
    if (selectedSomeNode.length === 2) {
      // 获取第二个节点索引
      const secondIndex = selectedNodes.value.findIndex(o => o.id === selectedSomeNode[1].id)
      // 
      selectedNodes.value.splice(secondIndex + 1, 0, node)
      // 为了动画效果添加延迟
      setTimeout(() => {
        for (let i = 0; i < 3; i++) {
          // const index = selectedNodes.value.findIndex(o => o.type === node.type)
          selectedNodes.value.splice(secondIndex - 1, 1)
        }
        // 消除后计算连击数，限时连续消除增加combo数，到达一定程度，限时启动狂热状态
        // 限时狂热状态下，卡槽 length + 1。随后恢复卡槽原长度
        // 消除后 comboNum = 1， 启动计时器，规定时间内再次消除，comboNum++
        // 判断comboNum > 10 ? 启动狂热模式 ： 重置comboNum

        preNode.value = null
        // 判断是否已经清空节点，即是否胜利
        if (delNode ? nodes.value.length === 0 : nodes.value.every(o => o.state > 0) && removeList.value.length === 0 && selectedNodes.value.length === 0) {
          removeFlag.value = true
          backFlag.value = true
          addSlotFlag.value = true
          events.winCallback && events.winCallback()
        }
        else {
          events.dropCallback && events.dropCallback()
        }
      }, 100)
    }
    else {
      events.clickCallback && events.clickCallback()
      const index = selectedNodes.value.findIndex(o => o.type === node.type)
      if (index > -1)
        selectedNodes.value.splice(index + 1, 0, node)
      else
        selectedNodes.value.push(node)
      // 判断卡槽是否已满，即失败
      if (selectedNodes.value.length === cardSlotLength.value) {
        removeFlag.value = true
        backFlag.value = true
        addSlotFlag.value = true
        events.loseCallback && events.loseCallback()
      }
    }
  }

  function handleSelectRemove(node: CardNode) {
    const index = removeList.value.findIndex(o => o.id === node.id)
    if (index > -1)
      removeList.value.splice(index, 1)
    handleSelect(node)
  }

  function handleBack() {
    const node = preNode.value
    if (!node)
      return
    preNode.value = null
    backFlag.value = true
    node.state = 0
    delNode && nodes.value.push(node)
    const index = selectedNodes.value.findIndex(o => o.id === node.id)
    selectedNodes.value.splice(index, 1)
  }

  function handleRemove() {
  // 从selectedNodes.value中取出3个 到 removeList.value中

    if (selectedNodes.value.length < 3)
      return
    removeFlag.value = true
    preNode.value = null
    for (let i = 0; i < 3; i++) {
      const node = selectedNodes.value.shift()
      if (!node)
        return
      removeList.value.push(node)
    }
  }

  function handleAddSlot() {
    addSlotFlag.value = true
    cardSlotLength.value = 8
  }

  function initData(config?: GameConfig | null) {
    const { cardNum, layerNum, trap } = { ...initConfig, ...config }
    histroyList.value = []
    backFlag.value = false
    removeFlag.value = false
    removeList.value = []
    addSlotFlag.value = false
    preNode.value = null
    nodes.value = []
    indexSet.clear()
    perFloorNodes = []
    selectedNodes.value = []
    floorList = []
    const isTrap = trap && floor(random(0, 100)) !== 50

    // 生成节点池
    const itemTypes = (new Array(cardNum).fill(0)).map((_, index) => index + 1)
    let itemList: number[] = []
    for (let i = 0; i < 3 * layerNum; i++)
      itemList = [...itemList, ...itemTypes]
    if (isTrap) {
      const len = itemList.length
      itemList.splice(len - cardNum, len)
    }
    // console.log('itemList', itemList)

    // 打乱节点
    itemList = shuffle(shuffle(itemList))

    // 获取屏幕大小
    const containerWidth = container.value!.clientWidth
    const containerHeight = container.value!.clientHeight
    const width = containerWidth / 2
    const height = containerHeight / 2 - 60

    // 初始化各个层级节点
    let len = 0
    let floorIndex = 1
    const itemLength = itemList.length
    while (len <= itemLength) {
      const maxFloorNum = floorIndex * floorIndex
      const floorNum = ceil(random(maxFloorNum / 2, maxFloorNum))
      floorList.push(itemList.splice(0, floorNum))
      len += floorNum
      floorIndex++
    }

    // console.log('floorList', floorList)
    floorList.forEach((o, index) => {
      indexSet.clear()
      let i = 0
      const floorNodes: CardNode[] = []
      o.forEach((k) => {
        i = floor(random(0, (index + 1) ** 2))
        while (indexSet.has(i))
          i = floor(random(0, (index + 1) ** 2))
        const row = floor(i / (index + 1))
        const column = index ? i % index : 0
        const node: CardNode = {
          id: `${index}-${i}`,
          type: k,
          zIndex: index,
          index: i,
          row,
          column,
          top: height + (size * row - (size / 2) * index),
          left: width + (size * column - (size / 2) * index),
          parents: [],
          state: 0,
        }
        const xy = [node.top, node.left]
        perFloorNodes.forEach((e) => {
          if (Math.abs(e.top - xy[0]) <= size && Math.abs(e.left - xy[1]) <= size)
            e.parents.push(node)
        })
        floorNodes.push(node)
        indexSet.add(i)
      })
      nodes.value = nodes.value.concat(floorNodes)
      perFloorNodes = floorNodes
    })

    updateState()
  }

  return {
    nodes,
    selectedNodes,
    removeFlag,
    removeList,
    backFlag,
    addSlotFlag,
    handleSelect,
    handleBack,
    handleRemove,
    handleSelectRemove,
    handleAddSlot,
    initData,
  }
}
