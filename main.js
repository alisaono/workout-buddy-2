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

let pose = {
  'FRONT_PLANK': 0,
  'SIDE_PLANK': 1,
  'PUSH_UP': 2,
  'CRUNCH': 3,
  'LUNGES': 4
}

FRONT_PLANK = false
SIDE_PLANK = false
PUSH_UP = false
CRUNCH = false
LUNGES = false

let straight_back = 0.1
let meh_straight = 30

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



//  Simple example of using private variables
//
//  To start the stopwatch:
//    obj.start();
//
//  To get the duration in milliseconds without pausing / resuming:
//    var x = obj.time();
//
//  To pause the stopwatch:
//    var x = obj.stop(); // Result is duration in milliseconds
//
//  To resume a paused stopwatch
//    var x = obj.start();  // Result is duration in milliseconds
//
//  To reset a paused stopwatch
//    obj.stop();
//
var clsStopwatch = function() {
    // Private vars
    var startAt = 0  // Time of last start / resume. (0 if not running)
    var lapTime = 0  // Time on the clock when last stopped in milliseconds

    var now = function() {
        return (new Date()).getTime() 
      } 
 
    // Public methods
    // Start or resume
    this.start = function() {
        startAt = startAt ? startAt : now()
      }

    // Stop or pause
    this.stop = function() {
        // If running, update elapsed time otherwise keep it
        lapTime = startAt ? lapTime + now() - startAt : lapTime
        startAt = 0 // Paused
      }

    // Reset
    this.reset = function() {
        lapTime = startAt = 0
      }

    // Duration
    this.time = function() {
        return lapTime + (startAt ? now() - startAt : 0)
      }
  }

var x = new clsStopwatch()
var $time
var clocktimer

function pad(num, size) {
  var s = "0000" + num
  return s.substr(s.length - size)
}

function formatTime(time) {
  var h = m = s = 0
  var newTime = ''

  h = Math.floor( time / (60 * 60 * 1000) )
  time = time % (60 * 60 * 1000)
  m = Math.floor( time / (60 * 1000) )
  time = time % (60 * 1000)
  s = Math.floor( time / 1000 )

  newTime = pad(h, 2) + ':' + pad(m, 2) + ':' + pad(s, 2)
  return newTime
}

function show() {
  $time = document.getElementById('time')
  update()
}

function update() {
  $time.innerHTML = formatTime(x.time())
}

function start() {
  clocktimer = setInterval("update()", 1)
  x.start()
}

function stop() {
  x.stop()
  clearInterval(clocktimer)
}

function reset() {
  stop()
  x.reset()
  update()
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

  neck_pos = [(key_lshoulder.position.x + key_rshoulder.position.x) / 2, (key_lshoulder.position.y + key_rshoulder.position.y) / 2]


  // if ((abs(key_lshoulder.position.x - key_lelbow.position.x) <= 30 ||
  //     abs(key_rshoulder.position.x - key_relbow.position.x) <= 30) &&
  //   (abs(key_lelbow.position.y - key_lwrist.position.y) <= 30 ||
  //     abs(key_relbow.position.y - key_rwrist.position.y) <= 30 ) &&
  //   (abs(key_nose.position.y - key_lshoulder.position.y) <= 50 ||
  //     abs(key_nose.position.y - key_rshoulder.position.y) <= 50) &&
  //   (abs((key_rshoulder.position.y - key_rknee.position.y) / (key_rshoulder.position.x - key_rknee.position.x)) <= straight_back ||
  //     abs((key_lshoulder.position.y - key_lknee.position.y) / (key_lshoulder.position.x - key_lknee.position.x)) <= straight_back) 
  //   ) {
  //   FRONT_PLANK = true
  //   start()
  // }
  // else{
  //   stop()
  // }



  if (abs(key_lshoulder.position.x - key_lelbow.position.x) <= 30 &&
      abs(key_rshoulder.position.x - key_relbow.position.x) <= 30 &&
      abs(key_lelbow.position.x - key_lwrist.position.x) <= 30 &&
      abs(key_relbow.position.x - key_rwrist.position.x) <= 30 &&
    (abs(key_nose.position.y - key_lshoulder.position.y) <= 50 ||
      abs(key_nose.position.y - key_rshoulder.position.y) <= 50) &&
    (abs((neck_pos[1] - key_rknee.position.y) / (neck_pos[0] - key_rknee.position.x)) <= 4 ||
      abs((neck_pos[1] - key_lknee.position.y) / (neck_pos[0] - key_lknee.position.x)) <= 4) 
    ) {
    SIDE_PLANK = true
    start()
  }
  // else{
  //   stop()
  // }


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
