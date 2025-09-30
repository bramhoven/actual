// @ts-strict-ignore
import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';

import { ButtonWithLoading } from '@actual-app/components/button';
import { InitialFocus } from '@actual-app/components/initial-focus';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { send } from 'loot-core/platform/client/fetch';
import * as monthUtils from 'loot-core/shared/months';

import { Error } from '@desktop-client/components/alerts';
import {
  Modal,
  ModalButtons,
  ModalCloseButton,
  ModalHeader,
} from '@desktop-client/components/common/Modal';
import { FormField, FormLabel } from '@desktop-client/components/forms';
import { type Modal as ModalType } from '@desktop-client/modals/modalsSlice';
import { DateSelect } from '../select/DateSelect';
import { useDateFormat } from '@desktop-client/hooks/useDateFormat';
import { useLocale } from '@desktop-client/hooks/useLocale';

type HistoricBankSyncModalProps = Extract<
  ModalType,
  { name: 'historic-bank-sync' }
>['options'];

export const HistoricBankSyncModal = ({
  onSync,
}: HistoricBankSyncModalProps) => {
  const locale = useLocale();
  const { t } = useTranslation();
  const dateFormat = useDateFormat() || 'MM/dd/yyyy';

  const historyDefaultDate = new Date();
  historyDefaultDate.setDate(historyDefaultDate.getDate() - 90);

  const [startDate, setStartDate] = useState(monthUtils.format(historyDefaultDate, `${dateFormat} EEEE`, locale));
  const [isValid, setIsValid] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(
    t('It is required to provide a start date.'),
  );

  const onSubmit = async (close: () => void) => {
    if (!startDate) {
      setIsValid(false);
      setError(
        t('It is required to provide a start date.'),
      );
      return;
    }

    setIsLoading(true);

    let { errors, newTransactions, matchedTransactions, updatedAccounts } =
      (await send('historic-bank-sync', {
        ids: [],
        startDate: startDate,
      })) || {};

    if (errors) {
      setIsLoading(false);
      setIsValid(false);
      setError("Failed to run historic sync");
      return;
    } 

    setIsValid(true);
    setIsLoading(false);
    close();
  };

  return (
    <Modal name="historic-bank-sync" containerProps={{ style: { width: '30vw' } }} isDismissable={false}>
      {({ state: { close } }) => (
        <>
          <ModalHeader
            title={t('Historic Bank Sync')}
            rightContent={<ModalCloseButton onPress={close} />}
          />
          <View style={{ display: 'flex', gap: 10, margin: 10 }}>
            <Text>
              <Trans>
                You can use the historic bank sync to retrieve old and missing transactions from the bank.
                Retrieval usually happens in chunks of 90 days. How much you can retrieve depends on your bank sync provider and it's rate limiting. 
              </Trans>
            </Text>

            <FormField>
              <View style={{ width: '13.44rem' }} >
                <FormLabel title={t('Start Date:')} htmlFor="historic-sync-start-date" />
                <InitialFocus>
                  <DateSelect
                    value={startDate}
                    onSelect={date => {
                      setIsValid(true);
                      setStartDate(date);
                    }}
                    dateFormat={dateFormat}
                  />
                </InitialFocus>
              </View>
            </FormField>

            {!isValid && <Error>{error}</Error>}
          </View>

          <ModalButtons>
            <ButtonWithLoading
              variant="primary"
              isLoading={isLoading}
              onPress={() => {
                onSubmit(close);
              }}
            >
              <Trans>Save and continue</Trans>
            </ButtonWithLoading>
          </ModalButtons>
        </>
      )}
    </Modal>
  );
};
