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

let pose = {
  'FRONT_PLANK': 0,
  'SIDE_PLANK': 1,
  'PUSH_UP': 2,
  'CRUNCH': 3,
  'LUNGES': 4
}

let FRONT_PLANK = false
let SIDE_PLANK = false
let PUSH_UP = false
let PUSH_DOWN = false
let CRUNCH_UP = false
let CRUNCH_DOWN = false

let pushup_counter = 0
let crunches_counter = 0

let detectType = ""
let detectDuration = 0
let detectReps = 0

let straight_back = 0.4
let straight_arm = 30
let straight_neck = 50


let video
let poseNet
let keypoints = new Array(NUM_JOINTS).fill(0)
let skeleton = []

let FRAME_BUFFER_SIZE = 5
let frameBuffer = []

//document.querySelector('#dummy').dispatchEvent(new MouseEvent("click", {}))

let onolo = new p5.Speech() // speech synthesis object

function setup() {
  createCanvas(VIDEO_WIDTH, VIDEO_HEIGHT)
  video = createCapture(VIDEO)
  video.size(width, height)

  poseNet = ml5.poseNet(video, 'single', onModelReady)

  poseNet.on('pose', onPoseUpdated)

  video.hide() // Hide the video element, and just show the canvas

  onolo.speak("Welcome! Time to start working out. Please select your workout on the right.")
}

function draw() {
  translate(video.width, 0)
  scale(-1, 1)
  image(video, 0, 0, width, height)

  if (SHOW_JOINTS) {
    drawKeypoints()
    // drawSkeleton()
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
  var m = s = ms = 0
  var newTime = ''

  // h = Math.floor( time / (60 * 60 * 1000) )
  time = time % (60 * 60 * 1000)
  m = Math.floor( time / (60 * 1000) )
  time = time % (60 * 1000)
  s = Math.floor( time / 1000 )
  ms = time % 1000

  newTime = pad(m, 2) + ':' + pad(s, 2) + ':' + pad(ms, 2)
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


function updateType() {
  let newType = document.getElementById("exercise-type").value
  if (newType === "") {
    detectType = ""
    document.getElementById("exercise-details").style.display = "none"
    return
  }

  if (newType === "front_plank" || newType === "side_plank") {
    if (newType === "front_plank") {
      document.getElementById("sample-image").src = "Front Plank.jpg"
    } else {
      document.getElementById("sample-image").src = "Side Plank.jpg"
    }
    document.getElementById("duration-input").style.display = "block"
    document.getElementById("reps-input").style.display = "none"
  }

  if (newType === "pushup" || newType === "crunch") {
    if (newType === "pushup") {
      document.getElementById("sample-image").src = "Push-ups.gif"
    } else {
      document.getElementById("sample-image").src = "Crunches.gif"
    }
    document.getElementById("duration-input").style.display = "none"
    document.getElementById("reps-input").style.display = "block"
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
    detectDuration = duration
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
    console.log(detectType, detectReps)
  }
}

function onPoseUpdated(poses) {
  if (poses.length === 0) {
    console.log('No one in the frame')
    return
  }

  // keypoints = poses[0].pose.keypoints
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

  // console.log(keypoints)

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


  if (detectType === 'front_plank') {
    counter = 0

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
      //FRONT_PLANK = true
      start()
      onolo.speak("Ready. Start.")

    } else {
      stop()
      message = []
      if(key_rwrist.position.y-key_relbow.position.y > straight_arm){
        message.push("lower your right hand to the ground")
      }
      if(key_lwrist.position.y-key_lelbow.position.y > straight_arm){
        message.push("lower your left hand to the ground")
      }
      if(key_relbow.position.y-key_rwrist.position.y > straight_arm){
        message.push("lower your right elbow to the ground")
      }
      if(key_lelbow.position.y-key_lwrist.position.y > straight_arm){
        message.push("lower your left elbow to the ground")
      }
      if(abs(key_lshoulder.position.x - key_lelbow.position.x) > straight_arm){
        message.push("make sure your left shoulder is aligned above your left elbow")
      }
      if(abs(key_rshoulder.position.x - key_relbow.position.x) > straight_arm){
        message.push("make sure your right shoulder is aligned above your right elbow")
      }
      if(abs(key_nose.position.y - key_lshoulder.position.y) > straight_neck ||
        abs(key_nose.position.y - key_rshoulder.position.y) > straight_neck){
        message.push("lower your head and make sure your shoulders are at the same height")
      }
      if(abs((key_rshoulder.position.y - key_rhip.position.y) / (key_rshoulder.position.x - key_rhip.position.x)) > straight_back ||
        abs((key_lshoulder.position.y - key_lhip.position.y) / (key_lshoulder.position.x - key_lhip.position.x)) > straight_back) {
        message.push("lower your hips and make sure your back is straight")
      }
      if (abs((key_rhip.position.y - key_rknee.position.y) / (key_rhip.position.x - key_rknee.position.x)) > 0.2 ||
        abs((key_lhip.position.y - key_lknee.position.y) / (key_lhip.position.x - key_lknee.position.x)) > 0.2) {
        message.push("straighten your knees")
      }

      spoken_message = "You are not in position. "
      if (message.length === 1) {
        spoken_message += "Please " + message[0]
      } else if (message.length > 1) {
        spoken_message += "Please "
        for (let i = 0; i < message.length - 1; i++) {
          spoken_message += message[i] + ", "
        }
        spoken_message += "and " + message[message.length - 1]
      }
      onolo.speak(spoken_message)
    }
  }

  if(detectType === 'side_plank') {
    neck_pos = [(key_lshoulder.position.x + key_rshoulder.position.x) / 2, (key_lshoulder.position.y + key_rshoulder.position.y) / 2]
    if (abs(key_lshoulder.position.x - key_lelbow.position.x) <= straight_arm &&
        abs(key_rshoulder.position.x - key_relbow.position.x) <= straight_arm &&
        abs(key_lelbow.position.x - key_lwrist.position.x) <= straight_arm &&
        abs(key_relbow.position.x - key_rwrist.position.x) <= straight_arm &&
      (abs(key_nose.position.y - key_lshoulder.position.y) <= straight_neck &&
        abs(key_nose.position.y - key_rshoulder.position.y) <= straight_neck) &&
      (abs((neck_pos[1] - key_rknee.position.y) / (neck_pos[0] - key_rknee.position.x)) <= 4 ||
        abs((neck_pos[1] - key_lknee.position.y) / (neck_pos[0] - key_lknee.position.x)) <= 4)
      ) {
      //SIDE_PLANK = true
      start()
      onolo.speak("Ready. Start.")
    }
    else{
      stop()
      message = []
      if(abs(key_lshoulder.position.x - key_lelbow.position.x) > straight_arm){
        message.push("straighten your upper left arm")
        message.push("make sure your shoulder and elbow are aligned right above one another")
      }
      if(abs(key_rshoulder.position.x - key_relbow.position.x) > straight_arm){
        message.push("straighten your upper right arm")
        message.push("make sure your shoulder and elbow are aligned right above one another")
      }
      if(abs(key_lelbow.position.x - key_lwrist.position.x) > straight_arm){
        message.push("straighten your left forearm")
        message.push("make sure your elbow and wrist are aligned right above one another")
      }
      if(abs(key_relbow.position.x - key_rwrist.position.x) > straight_arm) {
        message.push("straighten your right forearm")
        message.push("make sure your elbow and wrist are aligned right above one another")
      }
      if(abs(key_nose.position.y - key_lshoulder.position.y) > straight_neck ||
        abs(key_nose.position.y - key_rshoulder.position.y) > straight_neck){
        message.push("make sure your shoulders are aligned above one another")
      }
      if(abs((neck_pos[1] - key_rknee.position.y) / (neck_pos[0] - key_rknee.position.x)) > 4 ||
        abs((neck_pos[1] - key_lknee.position.y) / (neck_pos[0] - key_lknee.position.x)) > 4){
        message.push("straighten your back")
      }

      spoken_message = "You are not in position. "
      if (message.length === 1) {
        spoken_message += "Please " + message[0]
      } else if (message.length > 1) {
        spoken_message += "Please "
        for (let i = 0; i < message.length - 1; i++) {
          spoken_message += message[i] + ", "
        }
        spoken_message += "and " + message[message.length - 1]
      }
      onolo.speak(spoken_message)
    }
  }

  if(detectType === 'pushup'){
    onolo.speak("Ready. Start.")
    counter = 0
    sets_counter = 1
    neck_pos = [(key_lshoulder.position.x + key_rshoulder.position.x) / 2, (key_lshoulder.position.y + key_rshoulder.position.y) / 2]

    if ((abs(key_lshoulder.position.x - key_lelbow.position.x) <= straight_arm ||
        abs(key_rshoulder.position.x - key_relbow.position.x) <= straight_arm) &&
      (abs(key_lelbow.position.x - key_lwrist.position.x) <= straight_arm ||
        abs(key_relbow.position.x - key_rwrist.position.x) <= straight_arm ) &&
      (abs(key_nose.position.y - key_lshoulder.position.y) <= straight_neck ||
        abs(key_nose.position.y - key_rshoulder.position.y) <= straight_neck) &&
      (abs((key_rshoulder.position.y - key_rhip.position.y) / (key_rshoulder.position.x - key_rhip.position.x)) <= 0.5 ||
        abs((key_lshoulder.position.y - key_lhip.position.y) / (key_lshoulder.position.x - key_lhip.position.x)) <= 0.5) &&
      (abs((key_rhip.position.y - key_rknee.position.y) / (key_rhip.position.x - key_rknee.position.x)) <= 0.4 ||
        abs((key_lhip.position.y - key_lknee.position.y) / (key_lhip.position.x - key_lknee.position.x)) <= 0.4)
      ) {
      //PUSH_UP = true
      onolo.speak("Up.")
      //Maybe put a pause or delay to allow the person to go up
      counter += 1
    } else {
      //say that you're not in position
      message = []
      if(key_rwrist.position.y-key_relbow.position.y > straight_arm){
        message.push("lower your right hand to the ground")
      }
      if(key_lwrist.position.y-key_lelbow.position.y > straight_arm){
        message.push("lower your left hand to the ground")
      }
      if(key_relbow.position.x-key_rwrist.position.x > straight_arm){
        message.push("make sure your right elbow is over your right wrist in the up position")
      }
      if(key_lelbow.position.x-key_lwrist.position.x > straight_arm){
        message.push("make sure your left elbow is over your left wrist in the up position")
      }
      if(abs(key_lshoulder.position.x - key_lelbow.position.x) > straight_arm){
        message.push("make sure your left shoulder is aligned above your left elbow")
      }
      if(abs(key_rshoulder.position.x - key_relbow.position.x) > straight_arm){
        message.push("make sure your right shoulder is aligned above your right elbow")
      }
      if(abs(key_nose.position.y - key_lshoulder.position.y) > straight_neck ||
        abs(key_nose.position.y - key_rshoulder.position.y) > straight_neck){
        message.push("lower your head")
        message.push("make sure your shoulders are at the same height")
      }
      if(abs((key_rshoulder.position.y - key_rhip.position.y) / (key_rshoulder.position.x - key_rhip.position.x)) > straight_back ||
        abs((key_lshoulder.position.y - key_lhip.position.y) / (key_lshoulder.position.x - key_lhip.position.x)) > straight_back) {
        message.push("lower your hips")
        message.push("make sure your back is straight")
      }
      if (abs((key_rhip.position.y - key_rknee.position.y) / (key_rhip.position.x - key_rknee.position.x)) > 0.2 ||
        abs((key_lhip.position.y - key_lknee.position.y) / (key_lhip.position.x - key_lknee.position.x)) > 0.2) {
        message.push("straighten your knees")
      }

      spoken_message = "You are not in position. "
      if (message.length === 1) {
        spoken_message += "Please " + message[0]
      } else if (message.length > 1) {
        spoken_message += "Please "
        for (let i = 0; i < message.length - 1; i++) {
          spoken_message += message[i] + ", "
        }
        spoken_message += "and " + message[message.length - 1]
      }
      onolo.speak(spoken_message)
    }

    if ((abs(key_lshoulder.position.y - key_lelbow.position.y) <= 20 ||
        abs(key_rshoulder.position.y - key_relbow.position.y) <= 20) &&
      (abs(key_lshoulder.position.x - key_lelbow.position.x) <= straight_arm ||
        abs(key_rshoulder.position.x - key_relbow.position.x) <= straight_arm) &&
      (abs(key_lelbow.position.x - key_lwrist.position.x) <= straight_arm ||
        abs(key_relbow.position.x - key_rwrist.position.x) <= straight_arm ) &&
      (abs(key_nose.position.y - key_lshoulder.position.y) <= straight_neck ||
        abs(key_nose.position.y - key_rshoulder.position.y) <= straight_neck) &&
      (abs((key_rshoulder.position.y - key_rhip.position.y) / (key_rshoulder.position.x - key_rhip.position.x)) <= 0.3 ||
        abs((key_lshoulder.position.y - key_lhip.position.y) / (key_lshoulder.position.x - key_lhip.position.x)) <= 0.3) &&
      (abs((key_rhip.position.y - key_rknee.position.y) / (key_rhip.position.x - key_rknee.position.x)) <= 0.2 ||
        abs((key_lhip.position.y - key_lknee.position.y) / (key_lhip.position.x - key_lknee.position.x)) <= 0.2)
      ) {
      //PUSH_DOWN = true
      onolo.speak("Down. " + counter + " pushups.")
      if(counter === 10) {
        onolo.speak("You have done " + sets_counter + " sets of pushups.")
        sets_counter += 1
      }
    } else {
      //say that you're not in position
      message = []
      if(key_rwrist.position.y-key_relbow.position.y > straight_arm){
        message.push("lower your right hand to the ground")
      }
      if(key_lwrist.position.y-key_lelbow.position.y > straight_arm){
        messga.epush("lower your left hand to the ground")
      }
      if(key_relbow.position.x-key_rwrist.position.x > straight_arm){
        message.push("make sure your right elbow is over your right wrist in the down position")
      }
      if(key_lelbow.position.x-key_lwrist.position.x > straight_arm){
        message.push("make sure your left elbow is over your left wrist in the down positio")
      }
      if(abs(key_lshoulder.position.x - key_lelbow.position.x) > straight_arm){
        message.push("make sure your left shoulder is aligned above your left elbow")
      }
      if(abs(key_rshoulder.position.x - key_relbow.position.x) > straight_arm){
        message.push("make sure your right shoulder is aligned above your right elbow")
      }
      if(abs(key_nose.position.y - key_lshoulder.position.y) > straight_neck ||
        abs(key_nose.position.y - key_rshoulder.position.y) > straight_neck){
        message.push("lower your head")
        message.push("make sure your shoulders are at the same height")
      }
      if(abs((key_rshoulder.position.y - key_rhip.position.y) / (key_rshoulder.position.x - key_rhip.position.x)) > straight_back ||
        abs((key_lshoulder.position.y - key_lhip.position.y) / (key_lshoulder.position.x - key_lhip.position.x)) > straight_back) {
        message.push("lower your hips")
        message.push("make sure your back is straight")
      }
      if (abs((key_rhip.position.y - key_rknee.position.y) / (key_rhip.position.x - key_rknee.position.x)) > 0.2 ||
        abs((key_lhip.position.y - key_lknee.position.y) / (key_lhip.position.x - key_lknee.position.x)) > 0.2) {
        message.push("straighten your knees")
      }

      spoken_message = "You are not in position. "
      if (message.length === 1) {
        spoken_message += "Please " + message[0]
      } else if (message.length > 1) {
        spoken_message += "Please "
        for (let i = 0; i < message.length - 1; i++) {
          spoken_message += message[i] + ", "
        }
        spoken_message += "and " + message[message.length - 1]
      }
      onolo.speak(spoken_message)
    }

  }

  if(detectType === 'crunch'){
        onolo.speak("You have chosen Crunches. Please position yourself like the one in the photo. Start in the down position please." +
      " You should be laying down on the floor face up and knees bent." +
      " For the up position, please keep your knees in place and raise your upper body 45 degrees upward.")

    onolo.speak("Ready. Start.")
    sets_counter = 1
    neck_pos = [(key_lshoulder.position.x + key_rshoulder.position.x) / 2, (key_lshoulder.position.y + key_rshoulder.position.y) / 2]
    if ((abs(key_nose.position.y - key_lshoulder.position.y) <= straight_neck ||
        abs(key_nose.position.y - key_rshoulder.position.y) <= straight_neck) &&
      (abs((key_rshoulder.position.y - key_rhip.position.y) / (key_rshoulder.position.x - key_rhip.position.x)) <= 4 ||
        abs((key_lshoulder.position.y - key_lhip.position.y) / (key_lshoulder.position.x - key_lhip.position.x)) <= 4) &&
      (abs((key_rhip.position.y - key_rknee.position.y) / (key_rhip.position.x - key_rknee.position.x)) <= 2 ||
        abs((key_lhip.position.y - key_lknee.position.y) / (key_lhip.position.x - key_lknee.position.x)) <= 2) &&
      (abs((key_rknee.position.y - key_rankle.position.y) / (key_rknee.position.x - key_rankle.position.x)) <= 2 ||
        abs((key_lknee.position.y - key_lankle.position.y) / (key_lknee.position.x - key_lankle.position.x)) <= 2)
      ) {
      //CRUNCH_UP = true
    onolo.speak("Up.")
    } else {
      //say that you're not in position
      message = []
      if(abs(key_nose.position.y - key_lshoulder.position.y) > straight_neck ||
        abs(key_nose.position.y - key_rshoulder.position.y) > straight_neck) {
        message.push("lower your head")
        message.push("make sure your shoulders are at the same height")
      }
      if(abs((key_rshoulder.position.y - key_rhip.position.y) / (key_rshoulder.position.x - key_rhip.position.x)) > 4 ||
        abs((key_lshoulder.position.y - key_lhip.position.y) / (key_lshoulder.position.x - key_lhip.position.x)) > 4) {
        message.push("do not go all the way up, but only 45 degrees")
        message.push("make sure your back is straight")
      }
      if(abs((key_rhip.position.y - key_rknee.position.y) / (key_rhip.position.x - key_rknee.position.x)) > 2 ||
        abs((key_lhip.position.y - key_lknee.position.y) / (key_lhip.position.x - key_lknee.position.x)) > 2) {
        message.push("raise your knees to a comfortable bent height")
      }
      if(abs((key_rknee.position.y - key_rankle.position.y) / (key_rknee.position.x - key_rankle.position.x)) > 2 ||
        abs((key_lknee.position.y - key_lankle.position.y) / (key_lknee.position.x - key_lankle.position.x)) > 2){
        message.push("lower your knees")
      }

      spoken_message = "You are not in position. "
      if (message.length === 1) {
        spoken_message += "Please " + message[0]
      } else if (message.length > 1) {
        spoken_message += "Please "
        for (let i = 0; i < message.length - 1; i++) {
          spoken_message += message[i] + ", "
        }
        spoken_message += "and " + message[message.length - 1]
      }
      onolo.speak(spoken_message)
    }

    if ((abs(key_nose.position.y - key_lshoulder.position.y) <= straight_neck ||
        abs(key_nose.position.y - key_rshoulder.position.y) <= straight_neck) &&
      (abs((key_rshoulder.position.y - key_rhip.position.y) / (key_rshoulder.position.x - key_rhip.position.x)) <= 0.1 ||
        abs((key_lshoulder.position.y - key_lhip.position.y) / (key_lshoulder.position.x - key_lhip.position.x)) <= 0.1) &&
      (abs((key_rhip.position.y - key_rknee.position.y) / (key_rhip.position.x - key_rknee.position.x)) <= 2 ||
        abs((key_lhip.position.y - key_lknee.position.y) / (key_lhip.position.x - key_lknee.position.x)) <= 2) &&
      (abs((key_rknee.position.y - key_rankle.position.y) / (key_rknee.position.x - key_rankle.position.x)) <= 2 ||
        abs((key_lknee.position.y - key_lankle.position.y) / (key_lknee.position.x - key_lankle.position.x)) <= 2)
      ) {
      //CRUNCH_DOWN = true
      onolo.speak("Down. " + counter + " crunches.")
      if(counter === 10) {
        onolo.speak("You have done " + sets_counter + " sets of crunches.")
        sets_counter += 1
      }
    } else {
      //say that you're not in position
      message = []
      if(abs(key_nose.position.y - key_lshoulder.position.y) > straight_neck ||
        abs(key_nose.position.y - key_rshoulder.position.y) > straight_neck) {
        message.push("lower your head")
        message.push("make sure your shoulders are at the same height")
      }
      if(abs((key_rshoulder.position.y - key_rhip.position.y) / (key_rshoulder.position.x - key_rhip.position.x)) > 0.1 ||
        abs((key_lshoulder.position.y - key_lhip.position.y) / (key_lshoulder.position.x - key_lhip.position.x)) > 0.1) {
        message.push("please lay all the way down")
      }
      if(abs((key_rhip.position.y - key_rknee.position.y) / (key_rhip.position.x - key_rknee.position.x)) > 2 ||
        abs((key_lhip.position.y - key_lknee.position.y) / (key_lhip.position.x - key_lknee.position.x)) > 2) {
        message.push("raise your knees to a comfortable bent height")
      }
      if(abs((key_rknee.position.y - key_rankle.position.y) / (key_rknee.position.x - key_rankle.position.x)) > 2 ||
        abs((key_lknee.position.y - key_lankle.position.y) / (key_lknee.position.x - key_lankle.position.x)) > 2){
        message.push("lower your knees")
      }

      spoken_message = "You are not in position. "
      if (message.length === 1) {
        spoken_message += "Please " + message[0]
      } else if (message.length > 1) {
        spoken_message += "Please "
        for (let i = 0; i < message.length - 1; i++) {
          spoken_message += message[i] + ", "
        }
        spoken_message += "and " + message[message.length - 1]
      }
      onolo.speak(spoken_message)
    }

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

function drawSkeleton() {
  for (let bone of skeleton) {
    let partA = bone[0]
    let partB = bone[1]
    stroke(255, 0, 0)
    line(partA.position.x, partA.position.y, partB.position.x, partB.position.y)
  }
}
