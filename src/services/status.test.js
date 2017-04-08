jest.mock('./websocket');
jest.mock('./genesis');

import {StatusService} from './status'
import CothorityWS from './websocket'
import GenesisService from './genesis'

describe(StatusService, () => {

  beforeEach(() => {
    CothorityWS.getStatus = jest.fn();

    GenesisService.subscribe = function (listener) {
      const blocks = [{
        Roster: {
          list: [{
            address: '127.0.0.1:7000'
          }]
        }
      }];

      listener.onGenesisUpdate(blocks);
    }
  });

  it('should get the status', () => {
    expect.assertions(1);

    const status = {};
    CothorityWS.getStatus.mockReturnValue(Promise.resolve(status));

    return new Promise((resolve) => {
      const service = new StatusService();
      const listener = {
        onStatusUpdate() {
          if (Object.keys(service.status).length > 0) {
            expect(Object.keys(service.status)[0].indexOf('127.0.0.1')).toBe(0);
            resolve();
          }
        }
      };

      service.subscribe(listener);
    });
  });

  it('should subscribe and unsubscribe', () => {
    CothorityWS.getStatus.mockReturnValue(Promise.resolve());

    const service = new StatusService();
    const listener = {
      onStatusUpdate: jest.fn()
    };

    service.subscribe(listener);
    expect(listener.onStatusUpdate).toHaveBeenCalledTimes(1);
    expect(service.listeners.indexOf(listener) >= 0).toBeTruthy();

    service.subscribe(listener);
    expect(service.listeners.length).toBe(1);

    service.unsubscribe(listener);
    expect(service.listeners.indexOf(listener) === -1).toBeTruthy();

    service.unsubscribe(listener);
    expect(service.listeners.length).toBe(0);
  });

  it('should trigger events with the right interval', () => {
    expect.assertions(1);
    CothorityWS.getStatus.mockReturnValue(Promise.resolve({}));

    const listener = {onStatusUpdate: jest.fn()};
    const service = new StatusService();
    service.subscribe(listener);

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          expect(listener.onStatusUpdate.mock.calls.length <= 4).toBeTruthy();
        } catch (e) {
          console.log(e);
          reject();
          return;
        }

        resolve();
      }, 1000);
    });
  });

  it('should create the server object on error', () => {
    expect.assertions(1);
    CothorityWS.getStatus.mockReturnValue(Promise.reject());

    return new Promise((resolve) => {
      const service = new StatusService();
      const listener = {
        onStatusUpdate() {
          if (Object.keys(service.status).length > 0) {
            const key = Object.keys(service.status).pop();
            expect(service.status[key].server).toBeDefined();
            resolve();
          }
        }
      };

      service.subscribe(listener);
    });
  });

  it('should manage a listener without func declaration', () => {
    CothorityWS.getStatus.mockReturnValue(Promise.resolve());

    const listener = {};
    const service = new StatusService();

    service.subscribe(listener);
  });

  it('should return the available roster', () => {
    CothorityWS.getStatus.mockReturnValue(Promise.resolve());
    const service = new StatusService();
    service.status = {
      '1': {},
      '2': {}
    };

    expect(service.getAvailableRoster()).toHaveLength(2);
  });

});