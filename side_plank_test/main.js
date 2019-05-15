let DEBUG = true
let side_straight_arm = 30
let side_straight_neck = 50
let side_staight_body = 4

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

let FRAME_BUFFER_SIZE = 5
let frameBuffer = []

let typeNoEl = document.getElementById("type-no")
let typeYesEl = document.getElementById("type-yes")
let state = "no"

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

  // keypoints = poses[0].pose.keypoints

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

  // console.log(keypoints)

  // You can get the joint keypoint by:
  // e.g. keypoint = keypoints[JOINT_INDEX.NOSE]
  // e.g. keypoint = keypoints[JOINT_INDEX.RIGHT_KNEE]
  // and so on...
  // See line 5-24 for the full list of indices.

  // For each keypoint, you can get:
  // keypoint.position.x for x coord, keypoint.position.y for y coord,
  // keypoint.score for confidence %

  key_nose = keypoints[JOINT_INDEX.NOSE]
  key_lshoulder = keypoints[JOINT_INDEX.LEFT_SHOULDER]
  key_rshoulder = keypoints[JOINT_INDEX.RIGHT_SHOULDER]
  key_lelbow = keypoints[JOINT_INDEX.LEFT_ELBOW]
  key_relbow = keypoints[JOINT_INDEX.RIGHT_ELBOW]
  key_lwrist = keypoints[JOINT_INDEX.LEFT_WRIST]
  key_rwrist = keypoints[JOINT_INDEX.RIGHT_WRIST]
  key_lhip = keypoints[JOINT_INDEX.LEFT_HIP]
  key_rhip = keypoints[JOINT_INDEX.RIGHT_HIP]
  key_lknee = keypoints[JOINT_INDEX.LEFT_KNEE]
  key_rknee = keypoints[JOINT_INDEX.RIGHT_KNEE]
  key_lankle = keypoints[JOINT_INDEX.LEFT_ANKLE]
  key_rankle = keypoints[JOINT_INDEX.RIGHT_ANKLE]

  neck_pos = [
    (key_lshoulder.position.x + key_rshoulder.position.x) / 2,
    (key_lshoulder.position.y + key_rshoulder.position.y) / 2
  ]

  if (DEBUG) {
    if (abs(key_lshoulder.position.x - key_lelbow.position.x) > side_straight_arm) {
      console.log(`Left |shoulder.x - elbow.x| = ${abs(key_lshoulder.position.x - key_lelbow.position.x)} > ${side_straight_arm}`)
    }
    if (abs(key_rshoulder.position.x - key_relbow.position.x) > side_straight_arm) {
      console.log(`Right |shoulder.x - elbow.x| = ${abs(key_rshoulder.position.x - key_relbow.position.x)} > ${side_straight_arm}`)
    }
    if (abs(key_lelbow.position.x - key_lwrist.position.x) > side_straight_arm) {
      console.log(`Left |elbow.x - wrist.x| = ${abs(key_lelbow.position.x - key_lwrist.position.x)} > ${side_straight_arm}`)
    }
    if (abs(key_relbow.position.x - key_rwrist.position.x) > side_straight_arm) {
      console.log(`Right |elbow.x - wrist.x| = ${abs(key_relbow.position.x - key_rwrist.position.x)} > ${side_straight_arm}`)
    }
    if (abs(key_nose.position.y - key_lshoulder.position.y) > side_straight_neck) {
      console.log(`Left |nose.y - shoulder.y| = ${abs(key_nose.position.y - key_lshoulder.position.y)} > ${side_straight_neck}`)
    }
    if (abs(key_nose.position.y - key_rshoulder.position.y) > side_straight_neck) {
      console.log(`Right |nose.y - shoulder.y| = ${abs(key_nose.position.y - key_rshoulder.position.y)} > ${side_straight_neck}`)
    }
    if (abs((neck_pos[1] - key_rknee.position.y) / (neck_pos[0] - key_rknee.position.x)) > side_staight_body ||
      abs((neck_pos[1] - key_lknee.position.y) / (neck_pos[0] - key_lknee.position.x)) > side_staight_body) {
      console.log(`|neck-knee slope| > ${side_staight_body} Right: ${abs((neck_pos[1] - key_rknee.position.y) / (neck_pos[0] - key_rknee.position.x))}, Left: ${abs((neck_pos[1] - key_lknee.position.y) / (neck_pos[0] - key_lknee.position.x))}`)
    }
  }

  if (abs(key_lshoulder.position.x - key_lelbow.position.x) <= side_straight_arm &&
      abs(key_rshoulder.position.x - key_relbow.position.x) <= side_straight_arm &&
      abs(key_lelbow.position.x - key_lwrist.position.x) <= side_straight_arm &&
      abs(key_relbow.position.x - key_rwrist.position.x) <= side_straight_arm &&
      abs(key_nose.position.y - key_lshoulder.position.y) <= side_straight_neck &&
      abs(key_nose.position.y - key_rshoulder.position.y) <= side_straight_neck &&
      (abs((neck_pos[1] - key_rknee.position.y) / (neck_pos[0] - key_rknee.position.x)) <= side_staight_body ||
      abs((neck_pos[1] - key_lknee.position.y) / (neck_pos[0] - key_lknee.position.x)) <= side_staight_body)
    ) {
    if (state !== "yes") { // change label
      state = "yes"
      typeYesEl.style.display = 'block'
      typeNoEl.style.display = 'none'
    }
    return
  }

  if (state !== "no") { // change label
    state = "no"
    typeYesEl.style.display = 'none'
    typeNoEl.style.display = 'block'
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
