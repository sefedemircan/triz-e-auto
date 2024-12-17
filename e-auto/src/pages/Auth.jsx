import { useState } from 'react'
import {
  TextInput,
  PasswordInput,
  Paper,
  Title,
  Container,
  Button,
  Text,
  Divider,
  Stack,
  Center,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { IconCar } from '@tabler/icons-react'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      navigate('/')
    } catch (error) {
      notifications.show({
        title: 'Hata',
        message: error.message,
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container size={420} my={40}>
      <Center mb={40}>
        <IconCar size={48} color="#4c6ef5" stroke={1.5} />
      </Center>
      
      <Title
        align="center"
        sx={(theme) => ({ 
          fontFamily: theme.fontFamily,
          fontWeight: 900,
        })}
      >
        E-Auto
      </Title>
      <Text color="dimmed" size="sm" align="center" mt={5}>
        Araç Yönetim Sistemi.
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              required
              label="Email"
              placeholder="ornek@firma.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <PasswordInput
              required
              label="Şifre"
              placeholder="Şifreniz"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button 
              fullWidth 
              mt="xl" 
              type="submit" 
              loading={loading}
              variant="gradient"
              gradient={{ from: 'indigo', to: 'cyan' }}
            >
              Giriş Yap
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  )
} 