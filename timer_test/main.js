let VIDEO_WIDTH = 800
let VIDEO_HEIGHT = 600
let SHOW_JOINTS = true

// PoseNet indices from https://github.com/ml5js/ml5-website/issues/94
let JOINT_INDEX = {
  'NOSE': 0,
  'LEFT_EYE': 1,
  'RIGHT_EYE': 2,
  'LEFT_EAR': 3,
  'RIGHT_EAR': 4,
  'LEFT_SHOULDER': 5,
  'RIGHT_SHOULDER': 6,
  'LEFT_ELBOW': 7,
  'RIGHT_ELBOW': 8,
  'LEFT_WRIST': 9,
  'RIGHT_WRIST': 10,
  'LEFT_HIP': 11,
  'RIGHT_HIP': 12,
  'LEFT_KNEE': 13,
  'RIGHT_KNEE': 14,
  'LEFT_ANKLE': 15,
  'RIGHT_ANKLE': 16
}
let NUM_JOINTS = 17

let video
let poseNet
let keypoints = new Array(NUM_JOINTS).fill(0)
let skeleton = []

let FRAME_BUFFER_SIZE = 5
let frameBuffer = []

let currTime = 0 // ms
let isPlanking = false
let isTimerRunning = false
let setComplete = false

let timer = document.getElementById("timer")

function startPlank() {
  isPlanking = true
}

function stopPlank() {
  isPlanking = false
}

function startTimer() {
  isTimerRunning = true
}

function stopTimer() {
  isTimerRunning = false
}

let TIMER_INTERVAL = 100 // ms

setInterval(function() {
  if (isTimerRunning) {
    currTime += TIMER_INTERVAL
    timer.textContent = (currTime / 1000).toFixed(1)
  }
}, TIMER_INTERVAL)

function setup() {
  createCanvas(VIDEO_WIDTH, VIDEO_HEIGHT)
  video = createCapture(VIDEO)
  video.size(width, height)
  poseNet = ml5.poseNet(video, 'single', onModelReady)
  poseNet.on('pose', onPoseUpdated)
  video.hide() // Hide the video element, and just show the canvas
}

function draw() {
  translate(video.width, 0)
  scale(-1, 1)
  image(video, 0, 0, width, height)

  if (SHOW_JOINTS) {
    drawKeypoints()
  }
}

function onModelReady() {
  console.log('Model loaded')
}

function onPoseUpdated(poses) {
  if (poses.length === 0) {
    console.log('No one in the frame')
    return
  }

  if (setComplete) {
    console.log('Set completed!')
    return
  }

  skeleton = poses[0].skeleton

  if (frameBuffer.length < FRAME_BUFFER_SIZE) {
    // Do nothing if not enough frames in buffer
    frameBuffer.push(poses[0].pose.keypoints)
    return
  }
  frameBuffer.push(poses[0].pose.keypoints)
  frameBuffer.shift() // Remove the oldest frame

  for (let idx = 0; idx < NUM_JOINTS; idx++) {
    let bufferedKeypoints = []
    for (let frame of frameBuffer) {
      bufferedKeypoints.push(frame[idx])
    }
    bufferedKeypoints.sort((a, b) => a.score - b.score)
    bufferedKeypoints = bufferedKeypoints.slice(2)
    let averageX = bufferedKeypoints.reduce((acc, cur) => acc + cur.position.x, 0) / 3
    let averageY = bufferedKeypoints.reduce((acc, cur) => acc + cur.position.y, 0) / 3
    keypoints[idx] = {
      'position': {
        'x': averageX,
        'y': averageY
      }
    }
  }

  if (currTime > 10000) { // 10 sec
    console.log("end!")
    setComplete = true
    stopTimer()
    return // end
  }

  if (isPlanking) {
    startTimer()
  } else {
    stopTimer()
  }
}

function drawKeypoints() {
  if (keypoints[0] === 0) {
    return
  }
  for (let keypoint of keypoints) {
    // if (keypoint.score > 0.2) { // only show if confidence > 20%
      fill(255, 0, 0)
      noStroke()
      ellipse(keypoint.position.x, keypoint.position.y, 10, 10)
    // }
  }
}
