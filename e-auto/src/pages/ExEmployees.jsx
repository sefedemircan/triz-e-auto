import { useState, useEffect } from 'react'
import {
  Table,
  Text,
  Badge,
  Group,
  Paper,
  Stack,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { supabase } from '../lib/supabase'

const roleLabels = {
  manager: 'Yönetici',
  sales: 'Satış Danışmanı',
  mechanic: 'Teknisyen',
  accountant: 'Muhasebeci',
}

export default function ExEmployees() {
  const [exEmployees, setExEmployees] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchExEmployees()
  }, [])

  const fetchExEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('ex_employees')
        .select('*')
        .order('termination_date', { ascending: false })

      if (error) throw error

      setExEmployees(data)
    } catch (error) {
      notifications.show({
        title: 'Hata',
        message: 'Eski çalışanlar listesi yüklenirken bir hata oluştu',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack>
      <Text size="xl" weight={500}>Eski Çalışanlar</Text>

      <Paper withBorder radius="md" p="md">
        <Table>
          <thead>
            <tr>
              <th>Ad Soyad</th>
              <th>Email</th>
              <th>Telefon</th>
              <th>Pozisyon</th>
              <th>İşe Giriş</th>
              <th>İşten Çıkış</th>
            </tr>
          </thead>
          <tbody>
            {exEmployees.map((employee) => (
              <tr key={employee.id}>
                <td>{employee.first_name} {employee.last_name}</td>
                <td>{employee.email}</td>
                <td>{employee.phone || '-'}</td>
                <td>
                  <Badge>{roleLabels[employee.role]}</Badge>
                </td>
                <td>{new Date(employee.hire_date).toLocaleDateString('tr-TR')}</td>
                <td>{new Date(employee.termination_date).toLocaleDateString('tr-TR')}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Paper>
    </Stack>
  )
} 