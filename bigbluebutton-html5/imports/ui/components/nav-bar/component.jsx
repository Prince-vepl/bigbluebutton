import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Session } from 'meteor/session';
import cx from 'classnames';
import { withModalMounter } from '/imports/ui/components/modal/service';
import withShortcutHelper from '/imports/ui/components/shortcut-help/service';
import getFromUserSettings from '/imports/ui/services/users-settings';
import { defineMessages, injectIntl, intlShape } from 'react-intl';
import { styles } from './styles.scss';
import Button from '../button/component';
import RecordingIndicator from './recording-indicator/container';
import TalkingIndicatorContainer from '/imports/ui/components/nav-bar/talking-indicator/container';
import SettingsDropdownContainer from './settings-dropdown/container';
import ChatService from '../chat/service';
import UserLiseServices from  '../user-list/service'
import Meetings from '/imports/api/meetings';

const intlMessages = defineMessages({
  toggleUserListLabel: {
    id: 'app.navBar.userListToggleBtnLabel',
    description: 'Toggle button label',
  },
  raiseHandbel: {
    id: 'app.navBar.raiseHandbel',
    description: 'Raise Hand',
  },
  toggleUsersWebcam: {
    id: 'app.navBar.toggleUsersWebcam',
    description: 'Toggle users webcam permission',
  },
  unlockAllUsersWebcam: {
    id: 'app.navBar.unlockAllUsersWebcam',
    description: 'press to lock users webcam',
  },
  lockAllUsersWebcam: {
    id: 'app.navBar.lockAllUsersWebcam',
    description: 'press to unlock users webcam',
  },
  unlockAllUsersMic: {
    id: 'app.navBar.unlockAllUsersMic',
    description: 'press to lock users mic',
  },
  lockAllUsersMic: {
    id: 'app.navBar.lockAllUsersMic',
    description: 'press to unlock users mic',
  },
  toggleUserListAria: {
    id: 'app.navBar.toggleUserList.ariaLabel',
    description: 'description of the lists inside the userlist',
  },
  newMessages: {
    id: 'app.navBar.toggleUserList.newMessages',
    description: 'label for toggleUserList btn when showing red notification',
  },
});

const propTypes = {
  presentationTitle: PropTypes.string,
  hasUnreadMessages: PropTypes.bool,
  shortcuts: PropTypes.string,
  meeting: PropTypes.object.isRequired, // added by prince
  updateLockSettings: PropTypes.func.isRequired,
  intl: intlShape.isRequired,
};

const defaultProps = {
  presentationTitle: 'Default Room Title',
  hasUnreadMessages: false,
  shortcuts: '',
  meeting: null,
};

class NavBar extends PureComponent {

  constructor(props) { // added by prince
    super(props);

    const { meeting: { lockSettingsProps, usersProp } } = this.props;

    this.state = {
      lockSettingsProps,
      usersProp,
    };
  }

  static handleToggleUserList() {
    Session.set(
      'openPanel',
      Session.get('openPanel') !== ''
        ? ''
        : 'userlist',
    );
    Session.set('idChatOpen', '');
  }


  // added by prince
  static handleHandRaise(amIModerator, amIPresenter, amIViewer,User) {

	  if (amIModerator) {
		  ChatService.sendGroupMessage('Moderator : Hand raised');
	  } else if (amIPresenter) {
		  ChatService.sendGroupMessage('Presenter :Hand raised');
	  } else {
      ChatService.sendGroupMessage(' Hand raised');
    }
    UserLiseServices.setEmojiStatus(User._id,'raiseHand')
  }
  
  // added by prince
  handleAudioToggleButton() {
    const { updateLockSettings } = this.props;
    const { lockSettingsProps } = this.state;

    lockSettingsProps['disableMic'] = !lockSettingsProps['disableMic'];
    this.setState({
      lockSettingsProps,
    });

    updateLockSettings(lockSettingsProps);
  }
  
  // added by prince
    handleWebcamToggleButton() {
    const { updateLockSettings } = this.props;
    const { lockSettingsProps } = this.state;

    lockSettingsProps['disableCam'] = !lockSettingsProps['disableCam'];
    this.setState({
      lockSettingsProps,
    });

    updateLockSettings(lockSettingsProps);
  }

  
  isAudioLocked = (id) => {
  const meeting = Meetings.findOne({ meetingId: id }, { fields: { lockSettingsProps: 1 } });
  let isLocked = false;

  if (meeting.lockSettingsProps !== undefined) {
    const lockSettings = meeting.lockSettingsProps;

    if (lockSettings.disableMic) {
      isLocked = true;
    }
  }

  return isLocked;
};

isVideoLocked = (id) => {
  const meeting = Meetings.findOne({ meetingId: id }, { fields: { lockSettingsProps: 1 } });
  let isLocked = false;

  if (meeting.lockSettingsProps !== undefined) {
    const lockSettings = meeting.lockSettingsProps;

    if (lockSettings.disableCam) {
      isLocked = true;
    }
  }
  return isLocked;
};

   // added by prince     
  ShowWebcamToggleButton(amIViewer,intl,meeting)
   {
     if(!amIViewer)
     {
       return(
         <Button
                   data-test="userListToggleButton"
                   onClick={() => this.handleWebcamToggleButton()}
                   ghost
                   circle
                   hideLabel
                   label={this.isVideoLocked(meeting.meetingId)? intl.formatMessage(intlMessages.lockAllUsersWebcam) : intl.formatMessage(intlMessages.unlockAllUsersWebcam)}
                   aria-label={this.ariaLabel}
                   icon={this.isVideoLocked(meeting.meetingId)?"video_off": "video" }
                   className={cx(this.toggleBtnClasses)}
                   aria-expanded={this.isExpanded}
                   accessKey={this.TOGGLE_USERLIST_AK}
                 />
       );
     }
   }

     // added by prince     
  ShowAudioToggleButton(amIViewer,intl,meeting)
  {
    if(!amIViewer)
    {
      return(
        <Button
                  data-test="userListToggleButton"
                  onClick={() => this.handleAudioToggleButton()}
                  ghost
                  circle
                  hideLabel
                  label={this.isAudioLocked(meeting.meetingId) ? intl.formatMessage(intlMessages.lockAllUsersMic) :intl.formatMessage(intlMessages.unlockAllUsersMic)}
                  aria-label={this.ariaLabel}
                  icon={this.isAudioLocked(meeting.meetingId) ? "mute": "unmute"}
                  className={cx(this.toggleBtnClasses)}
                  aria-expanded={this.isExpanded}
                  accessKey={this.TOGGLE_USERLIST_AK}
                />
  
      );
    }
  }

  componentDidMount() {
    const {
      processOutsideToggleRecording,
      connectRecordingObserver,
      meeting,
      updateLockSettings,
      intl,
    } = this.props;

    if (Meteor.settings.public.allowOutsideCommands.toggleRecording
      || getFromUserSettings('bbb_outside_toggle_recording', false)) {
      connectRecordingObserver();
      window.addEventListener('message', processOutsideToggleRecording);
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    const {
      hasUnreadMessages,
      isExpanded,
      intl,
      shortcuts: TOGGLE_USERLIST_AK,
      mountModal,
      presentationTitle,
      amIModerator,
	    amIPresenter,
      amIViewer,
      User,
      meeting,
      updateLockSettings,
    } = this.props;


    const toggleBtnClasses = {};
    toggleBtnClasses[styles.btn] = true;
    toggleBtnClasses[styles.btnWithNotificationDot] = hasUnreadMessages;

    let ariaLabel = intl.formatMessage(intlMessages.toggleUserListAria);
    ariaLabel += hasUnreadMessages ? (` ${intl.formatMessage(intlMessages.newMessages)}`) : '';
      


    return (
      <div className={styles.navbar}>
        <div className={styles.top}>
          <div className={styles.left}>
            <Button
              data-test="userListToggleButton"
              onClick={NavBar.handleToggleUserList}
              ghost
              circle
              hideLabel
              label={intl.formatMessage(intlMessages.toggleUserListLabel)}
              aria-label={ariaLabel}
              icon="user"
              className={cx(toggleBtnClasses)}
              aria-expanded={isExpanded}
              accessKey={TOGGLE_USERLIST_AK}
            />
          </div>
          <div className={styles.left}> 
            <Button
              data-test="userListToggleButton"
              onClick={() => NavBar.handleHandRaise(amIModerator, amIPresenter, amIViewer,User)}
              ghost
              circle
              hideLabel
              label={intl.formatMessage(intlMessages.raiseHandbel)}
              aria-label={ariaLabel}
              icon="hand"
              className={cx(toggleBtnClasses)}
              aria-expanded={isExpanded}
              accessKey={TOGGLE_USERLIST_AK}
            />
          </div>
          <div className={styles.left}>
            { this.ShowWebcamToggleButton(amIViewer,intl,meeting) }
        
          </div>
          <div className={styles.left}>
            { this.ShowAudioToggleButton(amIViewer,intl,meeting) }
        
          </div>
          <div className={styles.center}>
            <h1 className={styles.presentationTitle}>{presentationTitle}</h1>

            <RecordingIndicator
              mountModal={mountModal}
              amIModerator={amIModerator}
            />
          </div>
          <div className={styles.right}>
            <SettingsDropdownContainer amIModerator={amIModerator} />
          </div>
        </div>
        <div className={styles.bottom}>
          <TalkingIndicatorContainer amIModerator={amIModerator} />
        </div>
      </div>
    );
  }
}

NavBar.propTypes = propTypes;
NavBar.defaultProps = defaultProps;
export default withShortcutHelper(withModalMounter(injectIntl(NavBar)), 'toggleUserList');
