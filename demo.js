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

let straight_back = 0.4
let straight_back_up = 2
let straight_back_down = 1
let straight_leg_up = 10
let straight_leg_down = .4
let straight_arm = 50
let straight_neck = 80

let currTime = 0 // ms
let currCount = 0 // reps
let currState = "" // up, down
let isTimerRunning = false
let isWorkoutComplete = false

let timer = document.getElementById("timer")
let counter = document.getElementById("counter")

function startTimer() {
  isTimerRunning = true
}

function stopTimer() {
  isTimerRunning = false
}

function resetTimer() {
  currTime = 0
}

let TIMER_INTERVAL = 100 // ms

setInterval(function() {
  if (isTimerRunning) {
    currTime += TIMER_INTERVAL
  }
  timer.textContent = (currTime / 1000).toFixed(1)
}, TIMER_INTERVAL)

function increCounter() {
  currCount += 1
  counter.textContent = currCount
}

function resetCounter() {
  state = ""
  currCount = 0
  counter.textContent = currCount
}

let detectType = ""
let detectDuration = 0
let detectReps = 0

let video
let poseNet
let keypoints = new Array(NUM_JOINTS).fill(0)

let FRAME_BUFFER_SIZE = 5
let frameBuffer = []

let onolo = new p5.Speech() // speech synthesis object

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

function updateType() {
  resetTimer()
  resetCounter()

  let newType = document.getElementById("exercise-type").value
  if (newType === "") {
    detectType = ""
    document.getElementById("exercise-details").style.display = "none"
    document.getElementById("timer-wrapper").style.display = 'none'
    document.getElementById("reps-wrapper").style.display = 'none'
    return
  }

  if (newType === "front_plank" || newType === "side_plank") {
    if (newType === "front_plank") {
      document.getElementById("sample-image").src = "images/Front Plank.jpg"
    } else {
      document.getElementById("sample-image").src = "images/Side Plank.jpg"
    }
    document.getElementById("duration-input").style.display = "block"
    document.getElementById("reps-input").style.display = "none"
    document.getElementById("timer-wrapper").style.display = 'block'
    document.getElementById("reps-wrapper").style.display = 'none'
  }

  if (newType === "pushup" || newType === "crunch") {
    if (newType === "pushup") {
      document.getElementById("sample-image").src = "images/Push-ups.gif"
    } else {
      document.getElementById("sample-image").src = "images/Crunches.gif"
    }
    document.getElementById("duration-input").style.display = "none"
    document.getElementById("reps-input").style.display = "block"
    document.getElementById("timer-wrapper").style.display = 'none'
    document.getElementById("reps-wrapper").style.display = 'block'
  }

  document.getElementById("exercise-details").style.display = "block"
}

function startWorkout() {
  let type = document.getElementById("exercise-type").value

  if (type === "front_plank" || type === "side_plank") {
    let duration = parseFloat(document.querySelector("#duration-input input").value)
    if (duration <= 0) {
      onolo.speak("Please choose a valid duration. Duration must be a positive number.")
      return
    }
    if (type === "front_plank") {
      onolo.speak("You have chosen Front Plank. Please position yourself like the one in the photo." +
        "Arms should be shoulder length apart, upper arm should be vertical and forearm horizontal on " +
        " the floor, making a right angle. Your back should be striaght from neck to toes.")
    } else {
      onolo.speak("You have chosen Side Plank. Please position yourself like the one in the photo." +
        " Your arms should be straight, one holding your body up and the other reaching towards the sky." +
        " Your back should be striaght from neck to toes.")
    }
    detectType = type
    detectDuration = parseInt(duration)
    isWorkoutComplete = false
    console.log(detectType, detectDuration)

  } else if (type === "pushup" || type === "crunch") {
    let reps = document.querySelector("#reps-input input").value
    if (parseFloat(reps) < 1) {
      onolo.speak("Please choose a valid number of reps. Reps must be at least 1.")
      return
    }
    if (parseFloat(reps) !== parseInt(reps)) {
      onolo.speak("Please choose a valid number of reps. Reps must be an integer.")
      return
    }
    if (type === "pushup") {
      onolo.speak("You have chosen Pushup. Please position yourself like the one in the photo. Start in the down position please." +
        " Your arms should be bent and shoulder length apart, legs and back straight and head looking striaght down." +
        " For the up position, please have arms straight out in front of you and for the down position, just lower your body to" +
        " the ground while only bending your arms.")
    } else {
      onolo.speak("You have chosen Crunch.")
    }
    detectType = type
    detectReps = parseInt(reps)
    isWorkoutComplete = false
    console.log(detectType, detectReps)
  }
}

function onPoseUpdated(poses) {
  if (poses.length === 0) {
    console.log('No one in the frame')
    return
  }

  if (isWorkoutComplete) {
    console.log('Ended')
    return
  }

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

  if (detectType === 'front_plank') {
    if ((abs(key_lshoulder.position.x - key_lelbow.position.x) <= straight_arm ||
        abs(key_rshoulder.position.x - key_relbow.position.x) <= straight_arm) &&
      (abs(key_lelbow.position.y - key_lwrist.position.y) <= straight_arm ||
        abs(key_relbow.position.y - key_rwrist.position.y) <= straight_arm ) &&
      (abs(key_nose.position.y - key_lshoulder.position.y) <= straight_neck ||
        abs(key_nose.position.y - key_rshoulder.position.y) <= straight_neck) &&
      (abs((key_rshoulder.position.y - key_rhip.position.y) / (key_rshoulder.position.x - key_rhip.position.x)) <= straight_back ||
        abs((key_lshoulder.position.y - key_lhip.position.y) / (key_lshoulder.position.x - key_lhip.position.x)) <= straight_back) &&
      (abs((key_rhip.position.y - key_rknee.position.y) / (key_rhip.position.x - key_rknee.position.x)) <= 0.2 ||
        abs((key_lhip.position.y - key_lknee.position.y) / (key_lhip.position.x - key_lknee.position.x)) <= 0.2)
      ) {
      startTimer()
      if (currTime > (detectDuration * 1000)) {
        isWorkoutComplete = true
        stopTimer()
        onolo.speak("Good job! You have done " + detectDuration + " seconds of front plank.")
      }
      return
    }

    stopTimer()
    message = []
    if (abs(key_rwrist.position.y-key_relbow.position.y) > straight_arm && abs(key_lwrist.position.y-key_lelbow.position.y) > straight_arm){
      message.push("lower your hands")
    }
    if (abs(key_relbow.position.y-key_rwrist.position.y) > straight_arm && abs(key_lelbow.position.y-key_lwrist.position.y) > straight_arm){
      message.push("lower your elbows")
    }
    if(abs(key_lshoulder.position.x - key_lelbow.position.x) > straight_arm && abs(key_rshoulder.position.x - key_relbow.position.x) > straight_arm){
      message.push("align your shoulders with elbows")
    }
    if(abs(key_nose.position.y - key_lshoulder.position.y) > straight_neck ||
      abs(key_nose.position.y - key_rshoulder.position.y) > straight_neck){
      message.push("lower your head")
    }
    if(abs((key_rshoulder.position.y - key_rhip.position.y) / (key_rshoulder.position.x - key_rhip.position.x)) > straight_back ||
      abs((key_lshoulder.position.y - key_lhip.position.y) / (key_lshoulder.position.x - key_lhip.position.x)) > straight_back) {
      message.push("lower your hips")
    }
    if (abs((key_rhip.position.y - key_rknee.position.y) / (key_rhip.position.x - key_rknee.position.x)) > 0.2 ||
      abs((key_lhip.position.y - key_lknee.position.y) / (key_lhip.position.x - key_lknee.position.x)) > 0.2) {
      message.push("straighten your legs")
    }

    spoken_message = ""
    if (message.length === 1) {
      spoken_message += message[0]
    } else if (message.length > 1) {
      for (let i = 0; i < message.length - 1; i++) {
        spoken_message += message[i] + ", "
      }
      spoken_message += "and " + message[message.length - 1]
    }
    onolo.speak(spoken_message)
  }

  if (detectType === 'side_plank') {
    // TODO:
  }

  if (detectType === 'pushup') {
    neck_pos = [(key_lshoulder.position.x + key_rshoulder.position.x) / 2, (key_lshoulder.position.y + key_rshoulder.position.y) / 2]

    if ((abs(key_lshoulder.position.x - key_lelbow.position.x) <= straight_arm ||
        abs(key_rshoulder.position.x - key_relbow.position.x) <= straight_arm) &&
      (abs(key_lelbow.position.x - key_lwrist.position.x) <= straight_arm ||
        abs(key_relbow.position.x - key_rwrist.position.x) <= straight_arm ) &&
      (abs(key_nose.position.y - key_lshoulder.position.y) <= straight_neck ||
        abs(key_nose.position.y - key_rshoulder.position.y) <= straight_neck) &&
      (abs((key_rshoulder.position.y - key_rhip.position.y) / (key_rshoulder.position.x - key_rhip.position.x)) <= straight_back_down ||
        abs((key_lshoulder.position.y - key_lhip.position.y) / (key_lshoulder.position.x - key_lhip.position.x)) <= straight_back_down) &&
      (abs((key_rhip.position.y - key_rknee.position.y) / (key_rhip.position.x - key_rknee.position.x)) <= straight_leg_down ||
        abs((key_lhip.position.y - key_lknee.position.y) / (key_lhip.position.x - key_lknee.position.x)) <= straight_leg_down)
      ) {
      console.log(`from ${state} to down`)
      state = "down"
      return
    }

    if ((abs(key_lshoulder.position.x - key_lelbow.position.x) <= straight_arm ||
        abs(key_rshoulder.position.x - key_relbow.position.x) <= straight_arm) &&
      (abs(key_lelbow.position.x - key_lwrist.position.x) <= straight_arm ||
        abs(key_relbow.position.x - key_rwrist.position.x) <= straight_arm ) &&
      (abs(key_nose.position.y - key_lshoulder.position.y) <= straight_neck ||
        abs(key_nose.position.y - key_rshoulder.position.y) <= straight_neck) &&
      (abs((key_rshoulder.position.y - key_rhip.position.y) / (key_rshoulder.position.x - key_rhip.position.x)) <= straight_back_up ||
         abs((key_lshoulder.position.y - key_lhip.position.y) / (key_lshoulder.position.x - key_lhip.position.x)) <= straight_back_up) &&
      (abs((key_rhip.position.y - key_rknee.position.y) / (key_rhip.position.x - key_rknee.position.x)) <= straight_leg_up ||
        abs((key_lhip.position.y - key_lknee.position.y) / (key_lhip.position.x - key_lknee.position.x)) <= straight_leg_up)
      ) {
      console.log(`from ${state} to up`)
      if (state === "down") {
        increCounter()
        if (currCount < detectReps) {
          onolo.speak(currCount)
        } else {
          isWorkoutComplete = true
          onolo.speak("Good job! You have done " + detectReps + " pushups.")
        }
      }
      state = "up"
      return
    }

    message = []
    if (
      abs(key_lshoulder.position.x - key_lelbow.position.x) > straight_arm ||
      abs(key_rshoulder.position.x - key_relbow.position.x) > straight_arm
    ) {
      message.push("align your shoulders with elbows")
    }
    if (
      abs(key_relbow.position.x - key_rwrist.position.x) > straight_arm ||
      abs(key_lelbow.position.x - key_lwrist.position.x) > straight_arm
    ) {
      message.push("lower your elbows")
    }
    if (
      abs(key_nose.position.y - key_lshoulder.position.y) > straight_neck ||
      abs(key_nose.position.y - key_rshoulder.position.y) > straight_neck
    ) {
      message.push("lower your head")
    }

    spoken_message = ""
    if (message.length === 1) {
      spoken_message += message[0]
    } else if (message.length > 1) {
      for (let i = 0; i < message.length - 1; i++) {
        spoken_message += message[i] + ", "
      }
      spoken_message += "and " + message[message.length - 1]
    }
    onolo.speak(spoken_message)
  }

  if (detectType === 'crunch') {
    // TODO:
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
