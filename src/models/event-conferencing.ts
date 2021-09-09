import Attributes from './attributes';
import Model from './model';

export interface EventConferencingDetailsProperties {
  meetingCode?: string;
  phone?: string[];
  password?: string;
  pin?: string;
  url?: string;
}

class EventConferencingDetails extends Model
  implements EventConferencingDetailsProperties {
  meetingCode?: string;
  phone?: string[];
  password?: string;
  pin?: string;
  url?: string;

  constructor(props?: EventConferencingProperties) {
    super();
    this.initAttributes(props);
  }

  toJSON() {
    return {
      meeting_code: this.meetingCode,
      phone: this.phone,
      password: this.password,
      pin: this.pin,
      url: this.url,
    };
  }
}

EventConferencingDetails.attributes = {
  meetingCode: Attributes.String({
    modelKey: 'meetingCode',
    jsonKey: 'meeting_code',
  }),
  phone: Attributes.StringList({
    modelKey: 'phone',
  }),
  password: Attributes.String({
    modelKey: 'password',
  }),
  pin: Attributes.String({
    modelKey: 'pin',
  }),
  url: Attributes.String({
    modelKey: 'url',
  }),
};

export interface EventConferencingProperties {
  provider: string;
  details?: EventConferencingDetailsProperties;
  autocreate?: {
    settings?: object;
  };
}

export class EventConferencing extends Model
  implements EventConferencingProperties {
  provider = '';
  details?: EventConferencingDetails;
  autocreate?: {
    settings?: { [key: string]: string };
  };

  constructor(props?: EventConferencingProperties) {
    super();
    this.initAttributes(props);
  }

  toJSON(): any {
    return {
      details: this.details,
      provider: this.provider,
      autocreate: this.autocreate,
    };
  }
}

EventConferencing.attributes = {
  details: Attributes.Object({
    modelKey: 'details',
    itemClass: EventConferencingDetails,
  }),
  provider: Attributes.String({
    modelKey: 'provider',
  }),
  autocreate: Attributes.Object({
    modelKey: 'autocreate',
  }),
};
