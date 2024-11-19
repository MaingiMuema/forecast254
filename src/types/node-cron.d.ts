declare module 'node-cron' {
  namespace cron {
    interface ScheduledTask {
      start: () => void;
      stop: () => void;
      destroy: () => void;
    }

    interface ScheduleOptions {
      scheduled?: boolean;
      timezone?: string;
    }
  }

  function schedule(
    expression: string,
    func: () => void,
    options?: cron.ScheduleOptions
  ): cron.ScheduledTask;

  export = {
    schedule,
  };
}
