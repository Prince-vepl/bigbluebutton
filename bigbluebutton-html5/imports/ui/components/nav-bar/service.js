import Auth from '/imports/ui/services/auth';
import { makeCall } from '/imports/ui/services/api';
import RecordMeetings from '/imports/api/meetings';
import Users from '/imports/api/users';

const processOutsideToggleRecording = (e) => {
  switch (e.data) {
    case 'c_record': {
      makeCall('toggleRecording');
      break;
    }
    case 'c_recording_status': {
      const recordingState = (RecordMeetings.findOne({ meetingId: Auth.meetingID })).recording;
      const recordingMessage = recordingState ? 'recordingStarted' : 'recordingStopped';
      this.window.parent.postMessage({ response: recordingMessage }, '*');
      break;
    }
    default: {
      // console.log(e.data);
    }
  }
};

const connectRecordingObserver = () => {
  // notify on load complete
  this.window.parent.postMessage({ response: 'readyToConnect' }, '*');
};

export default {
  amIPresenter: () => Users.findOne({ userId: Auth.userID }, { fields: { presenter: 1 } }).presenter,
  connectRecordingObserver: () => connectRecordingObserver(),
  processOutsideToggleRecording: arg => processOutsideToggleRecording(arg),
};
