import RestfulModel from './restful-model';
import NylasConnection from '../nylas-connection';

export default class ManagementModel extends RestfulModel {
  clientId: string;

  constructor(
    connection: NylasConnection,
    clientId: string,
    props: { [key: string]: any }
  ) {
    super(connection, props);
    this.clientId = clientId;
  }
}
