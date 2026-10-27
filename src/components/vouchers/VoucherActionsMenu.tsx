import { Dropdown } from '@heroui/react'
import { EllipsisVertical } from 'lucide-react'
import { Button } from '../ui/Button'
import { navigate } from '../../navigation/navigate'
import type { Voucher } from '../../types/voucher'

export function VoucherActionsMenu({ voucher }: { voucher: Voucher }) {
  return <Dropdown>
    <Button
      variant="secondary"
      isIconOnly
      className="voucher-actions-button"
      aria-label={`Ações de ${voucher.code}`}
      startIcon={EllipsisVertical}
    />
    <Dropdown.Popover>
      <Dropdown.Menu aria-label={`Ações de ${voucher.code}`}>
        <Dropdown.Item id="history" textValue="Ver histórico" onAction={() => navigate(`/vouchers/${encodeURIComponent(voucher.id)}/historico`)}>
          Ver histórico
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown.Popover>
  </Dropdown>
}
