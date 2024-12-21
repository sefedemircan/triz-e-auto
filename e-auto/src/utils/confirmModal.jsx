import React from 'react'
import { modals } from '@mantine/modals'
import { Text } from '@mantine/core'

export const confirmModal = ({
  title,
  message,
  confirmLabel = 'Evet',
  cancelLabel = 'İptal',
  confirmColor = 'red',
  onConfirm,
}) => {
  return new Promise((resolve) => {
    modals.openConfirmModal({
      title,
      centered: true,
      children: <Text size="sm">{message}</Text>,
      labels: { confirm: confirmLabel, cancel: cancelLabel },
      confirmProps: { color: confirmColor },
      onConfirm: async () => {
        await onConfirm()
        resolve(true)
      },
      onCancel: () => resolve(false),
    })
  })
} 