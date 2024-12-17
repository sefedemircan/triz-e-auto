import { useState, useEffect } from 'react'
import {
  Table,
  Group,
  Button,
  Text,
  ActionIcon,
  Modal,
  TextInput,
  NumberInput,
  Select,
  Stack,
  Badge,
  ThemeIcon,
  Paper,
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconEdit, IconTrash, IconPlus, IconArrowRight, IconUsers, IconCash } from '@tabler/icons-react'
import { supabase } from '../lib/supabase'
import dayjs from 'dayjs'
import classes from '../styles/Paper.module.css'

const roleLabels = {
  manager: 'Yönetici',
  sales: 'Satış Danışmanı',
  mechanic: 'Teknisyen',
  accountant: 'Muhasebeci',
}

export default function Employees() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [opened, setOpened] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)

  const form = useForm({
    initialValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role: '',
      hire_date: new Date(),
      salary: 0,
      insurance_amount: 0,
      salary_day: 1,
    },
    validate: {
      first_name: (value) => !value && 'Ad giriniz',
      last_name: (value) => !value && 'Soyad giriniz',
      email: (value) => !value && 'Email giriniz',
      role: (value) => !value && 'Pozisyon seçiniz',
      salary: (value) => value <= 0 && 'Geçerli bir maaş giriniz',
      insurance_amount: (value) => value <= 0 && 'Geçerli bir SGK tutarı giriniz',
      salary_day: (value) => (value < 1 || value > 31) && 'Geçerli bir gün giriniz',
    },
  })

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    if (editingEmployee) {
      form.setValues({
        ...editingEmployee,
        hire_date: editingEmployee.hire_date ? new Date(editingEmployee.hire_date) : null,
      })
    }
  }, [editingEmployee])

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setEmployees(data)
    } catch (error) {
      notifications.show({
        title: 'Hata',
        message: 'Personel listesi yüklenirken bir hata oluştu',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (values) => {
    try {
      const formData = {
        ...values,
        hire_date: values.hire_date ? dayjs(values.hire_date).format('YYYY-MM-DD') : null,
      }

      if (editingEmployee) {
        const { error } = await supabase
          .from('employees')
          .update(formData)
          .eq('id', editingEmployee.id)

        if (error) throw error

        notifications.show({
          title: 'Başarılı',
          message: 'Personel bilgileri güncellendi',
          color: 'green',
        })
      } else {
        const { error } = await supabase
          .from('employees')
          .insert([formData])

        if (error) throw error

        notifications.show({
          title: 'Başarılı',
          message: 'Yeni personel eklendi',
          color: 'green',
        })
      }

      setOpened(false)
      form.reset()
      setEditingEmployee(null)
      fetchEmployees()
    } catch (error) {
      notifications.show({
        title: 'Hata',
        message: error.message,
        color: 'red',
      })
    }
  }

  const handleTerminate = async (employee) => {
    if (window.confirm(`${employee.first_name} ${employee.last_name} işten çıkarılacak. Onaylıyor musunuz?`)) {
      try {
        // Önce ex_employees tablosuna ekle
        const { error: insertError } = await supabase
          .from('ex_employees')
          .insert([{
            employee_id: employee.id,
            first_name: employee.first_name,
            last_name: employee.last_name,
            email: employee.email,
            phone: employee.phone,
            role: employee.role,
            hire_date: employee.hire_date,
            termination_date: new Date().toISOString(),
          }])

        if (insertError) throw insertError

        // Sonra employees tablosundan sil
        const { error: deleteError } = await supabase
          .from('employees')
          .delete()
          .eq('id', employee.id)

        if (deleteError) throw deleteError

        notifications.show({
          title: 'Başarılı',
          message: 'Personel işten çıkarıldı',
          color: 'green',
        })

        fetchEmployees()
      } catch (error) {
        notifications.show({
          title: 'Hata',
          message: error.message,
          color: 'red',
        })
      }
    }
  }

  const handleSalaryPayment = async (employee) => {
    try {
      // Maaş ödemesi kaydı
      const { error: paymentError } = await supabase
        .from('employee_payments')
        .insert([{
          employee_id: employee.id,
          payment_date: new Date().toISOString(),
          amount: employee.salary,
          type: 'salary',
          description: `${dayjs().format('MMMM YYYY')} Maaş Ödemesi`,
        }])

      if (paymentError) throw paymentError

      // Masraf olarak ekle
      const { error: expenseError } = await supabase
        .from('vehicle_expenses')
        .insert([{
          expense_type: 'other',
          amount: employee.salary,
          description: `Maaş Ödemesi: ${employee.first_name} ${employee.last_name}`,
          expense_date: new Date().toISOString(),
        }])

      if (expenseError) throw expenseError

      notifications.show({
        title: 'Başarılı',
        message: 'Maaş ödemesi kaydedildi',
        color: 'green',
      })

      fetchEmployees()
    } catch (error) {
      notifications.show({
        title: 'Hata',
        message: error.message,
        color: 'red',
      })
    }
  }

  const handleInsurancePayment = async (employee) => {
    try {
      // Sigorta ödemesi kaydı
      const { error: paymentError } = await supabase
        .from('employee_payments')
        .insert([{
          employee_id: employee.id,
          payment_date: new Date().toISOString(),
          amount: employee.insurance_amount,
          type: 'insurance',
          description: `${dayjs().format('MMMM YYYY')} SGK Ödemesi`,
        }])

      if (paymentError) throw paymentError

      // Masraf olarak ekle
      const { error: expenseError } = await supabase
        .from('vehicle_expenses')
        .insert([{
          expense_type: 'other',
          amount: employee.insurance_amount,
          description: `SGK Ödemesi: ${employee.first_name} ${employee.last_name}`,
          expense_date: new Date().toISOString(),
        }])

      if (expenseError) throw expenseError

      notifications.show({
        title: 'Başarılı',
        message: 'SGK ödemesi kaydedildi',
        color: 'green',
      })

      fetchEmployees()
    } catch (error) {
      notifications.show({
        title: 'Hata',
        message: error.message,
        color: 'red',
      })
    }
  }

  return (
    <Stack spacing="lg">
      <Group position="apart">
        <Group spacing="xs">
          <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: 'orange', to: 'red' }}>
            <IconUsers size={20} />
          </ThemeIcon>
          <Text size="xl" weight={600}>Personel</Text>
        </Group>
        <Button
          leftSection={<IconPlus size={20} />}
          variant="gradient"
          gradient={{ from: 'orange', to: 'red' }}
          onClick={() => {
            form.reset()
            setEditingEmployee(null)
            setOpened(true)
          }}
        >
          Yeni Personel Ekle
        </Button>
      </Group>

      <Paper
        p="md"
        radius="md"
        withBorder
        className={classes.paper}
      >
        <Table highlightOnHover>
          <thead>
            <tr>
              <th>Ad Soyad</th>
              <th>Email</th>
              <th>Telefon</th>
              <th>Pozisyon</th>
              <th>İşe Giriş</th>
              <th>Maaş</th>
              <th>SGK</th>
              <th>Maaş Günü</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id}>
                <td>{employee.first_name} {employee.last_name}</td>
                <td>{employee.email}</td>
                <td>{employee.phone || '-'}</td>
                <td>
                  <Badge>{roleLabels[employee.role]}</Badge>
                </td>
                <td>{new Date(employee.hire_date).toLocaleDateString('tr-TR')}</td>
                <td>{employee.salary?.toLocaleString('tr-TR')} ₺</td>
                <td>{employee.insurance_amount?.toLocaleString('tr-TR')} ₺</td>
                <td>{employee.salary_day}</td>
                <td>
                  <Group spacing={4}>
                    <ActionIcon 
                      color="green"
                      onClick={() => {
                        if (window.confirm(`${employee.first_name} ${employee.last_name} için ${employee.salary.toLocaleString('tr-TR')} ₺ maaş ödemesi yapılacak. Onaylıyor musunuz?`)) {
                          handleSalaryPayment(employee)
                        }
                      }}
                      title="Maaş Öde"
                    >
                      <IconCash size={18} />
                    </ActionIcon>
                    <ActionIcon 
                      color="blue"
                      onClick={() => {
                        if (window.confirm(`${employee.first_name} ${employee.last_name} için ${employee.insurance_amount.toLocaleString('tr-TR')} ₺ SGK ödemesi yapılacak. Onaylıyor musunuz?`)) {
                          handleInsurancePayment(employee)
                        }
                      }}
                      title="SGK Öde"
                    >
                      <IconCash size={18} />
                    </ActionIcon>
                    <ActionIcon onClick={() => {
                      setEditingEmployee(employee)
                      form.setValues(employee)
                      setOpened(true)
                    }}>
                      <IconEdit size={18} />
                    </ActionIcon>
                    <ActionIcon color="red" onClick={() => handleTerminate(employee)}>
                      <IconArrowRight size={18} />
                    </ActionIcon>
                  </Group>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Paper>

      <Modal
        opened={opened}
        onClose={() => {
          setOpened(false)
          form.reset()
          setEditingEmployee(null)
        }}
        title={
          <Group spacing="xs">
            <ThemeIcon color="orange" variant="light">
              <IconUsers size={16} />
            </ThemeIcon>
            <Text>{editingEmployee ? 'Personel Düzenle' : 'Yeni Personel Ekle'}</Text>
          </Group>
        }
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Group grow>
              <TextInput
                required
                label="Ad"
                placeholder="Ahmet"
                {...form.getInputProps('first_name')}
              />
              <TextInput
                required
                label="Soyad"
                placeholder="Yılmaz"
                {...form.getInputProps('last_name')}
              />
            </Group>

            <Group grow>
              <TextInput
                required
                label="Email"
                placeholder="ahmet@firma.com"
                {...form.getInputProps('email')}
              />
              <TextInput
                label="Telefon"
                placeholder="0555 555 5555"
                {...form.getInputProps('phone')}
              />
            </Group>

            <Group grow>
              <Select
                required
                label="Pozisyon"
                placeholder="Seçiniz"
                data={[
                  { value: 'manager', label: 'Yönetici' },
                  { value: 'sales', label: 'Satış Danışmanı' },
                  { value: 'mechanic', label: 'Teknisyen' },
                  { value: 'accountant', label: 'Muhasebeci' },
                ]}
                {...form.getInputProps('role')}
              />
              <DateInput
                required
                label="İşe Giriş Tarihi"
                placeholder="Tarih seçin"
                valueFormat="DD.MM.YYYY"
                clearable
                value={form.values.hire_date ? new Date(form.values.hire_date) : null}
                onChange={(date) => form.setFieldValue('hire_date', date)}
              />
            </Group>

            <Group grow>
              <NumberInput
                required
                label="Maaş"
                placeholder="25000"
                min={0}
                {...form.getInputProps('salary')}
              />
              <NumberInput
                required
                label="Sigorta Tutarı"
                placeholder="5000"
                min={0}
                {...form.getInputProps('insurance_amount')}
              />
            </Group>

            <Group grow>
              <NumberInput
                required
                label="Yemek Yardımı"
                placeholder="2000"
                min={0}
                {...form.getInputProps('food_allowance')}
              />
              <NumberInput
                required
                label="Maaş Günü"
                placeholder="1"
                min={1}
                max={31}
                {...form.getInputProps('salary_day')}
              />
            </Group>

            <Button type="submit">Kaydet</Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  )
} 