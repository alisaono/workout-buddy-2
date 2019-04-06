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

let video
let poseNet
let keypoints = []
let skeleton = []

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
    drawSkeleton()
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

  keypoints = poses[0].pose.keypoints
  skeleton = poses[0].skeleton

  // TODO: Do stuff with the keypoints
  // (Ignore skeleton; it's just for drawing)

  // You can get the joint keypoint by:
  // e.g. keypoint = keypoints[JOINT_INDEX.NOSE]
  // e.g. keypoint = keypoints[JOINT_INDEX.RIGHT_KNEE]
  // and so on...
  // See line 5-24 for the full list of indices.

  // For each keypoint, you can get:
  // keypoint.position.x for x coord, keypoint.position.y for y coord,
  // keypoint.score for confidence %
}

function drawKeypoints() {
  for (let keypoint of keypoints) {
    if (keypoint.score > 0.2) { // only show if confidence > 20%
      fill(255, 0, 0)
      noStroke()
      ellipse(keypoint.position.x, keypoint.position.y, 10, 10)
    }
  }
}

function drawSkeleton() {
  for (let bone of skeleton) {
    let partA = bone[0]
    let partB = bone[1]
    stroke(255, 0, 0)
    line(partA.position.x, partA.position.y, partB.position.x, partB.position.y)
  }
}
