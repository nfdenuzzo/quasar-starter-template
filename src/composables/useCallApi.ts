import { api } from 'boot/axios';
import { RequestType, AppException } from 'src/interface/common';
import { date, Cookies } from 'quasar';
import userBase from 'src/composables/useBase';
import { useLang } from 'src/composables/useLang';
import { useSSRContext } from 'vue';
import { AppAuthTokenKey } from 'src/utils/constant';
export default () => {
  const { WeeToast, WeeLoader } = userBase();
  const { locale, t } = useLang();
  const ssrContext = process.env.SERVER ? useSSRContext() : null;
  const cookies = process.env.SERVER ? Cookies.parseSSR(ssrContext) : Cookies; // otherwise we're on client
  // const reqHeader = () => {
  //   return {
  //     Authorization: `Bearer ${token}`,
  //     'Content-Type': 'application/json',
  //     'Accept-Apiclient': 'default',
  //     'Accept-Language': locale.value,
  //   };
  // };
  const isAppException = (obj: any): obj is AppException => {
    return (
      obj.status !== undefined &&
      obj.message !== undefined &&
      obj.errors !== undefined
    );
  };
  const notifyMessage = (response: AppException): void => {
    WeeToast(
      `<strong>${response.message}</strong><br> ${response.errors.join(
        '<br>'
      )}`,
      {
        multiLine: true,
        html: true,
        type: 'negative',
        timeout: 10 * 1000,
        position: 'top',
        caption: date.formatDate(response.timestamp, 'DD MMM YYYY, HH:mm:ss'),
        actions: [
          {
            label: t('base.close'),
            color: 'white',
            handler: () => {
              /* ... */
            },
          },
        ],
      }
    );
  };
  const useFetch = <T>(req: RequestType): Promise<T> => {
    return new Promise((resolve, reject) => {
      // api.defaults.headers = reqHeader();
      // api.defaults.headers['Accept-Language'] = locale.value;
      // api.defaults.headers.Authorization = `Bearer ${token}`;
      api.defaults.headers.common['Accept-Language'] = locale.value;
      api.defaults.headers.common.Authorization = `Bearer ${cookies.get(
        AppAuthTokenKey
      )}`;
      // console.log('api', api.defaults);

      api({
        method: req.method,
        url: req.API,
        data: req.body ? req.body : undefined,
      })
        .then((response) => {
          if (isAppException(response.data)) {
            notifyMessage(response.data);
          }
          resolve(response.data);
        })
        .catch((error) => {
          console.log('catch', error);
          reject(error.message);
          WeeLoader(false);
          WeeToast(`<strong>${error.code}</strong><br> ${error.message}`, {
            multiLine: true,
            html: true,
            type: 'negative',
            timeout: 10 * 1000,
            position: 'top',
            actions: [
              {
                label: t('base.close'),
                color: 'white',
                handler: () => {
                  /* ... */
                },
              },
            ],
          });
        });

      // api
      //   .get(req.API)
      //   .then((response) => {
      //     resolve(response.data);
      //   })
      //   .catch((error) => {
      //     reject(error.message);
      //     WeeLoader(false);
      //     WeeToast(error.message, {
      //       multiLine: true,
      //       type: 'negative',
      //       timeout: 10 * 1000,
      //     });
      //   });
    });
  };
  return { useFetch };
};
