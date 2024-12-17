import { useState } from 'react'
import {
  AppShell,
  Navbar,
  Header,
  Text,
  MediaQuery,
  Burger,
  useMantineTheme,
  UnstyledButton,
  Group,
  ThemeIcon,
  Divider,
  Stack,
  ActionIcon,
} from '@mantine/core'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  IconDashboard,
  IconCar,
  IconUsers,
  IconUserOff,
  IconLogout,
  IconCarOff,
} from '@tabler/icons-react'

const mainLinks = [
  { icon: IconDashboard, color: 'blue', label: 'Genel Bakış', to: '/' },
  { icon: IconCar, color: 'teal', label: 'Araçlar', to: '/vehicles' },
  { icon: IconCarOff, color: 'grape', label: 'Satılan Araçlar', to: '/sold-vehicles' },
  { icon: IconUsers, color: 'orange', label: 'Personel', to: '/employees' },
  { icon: IconUserOff, color: 'red', label: 'Eski Personel', to: '/ex-employees' },
]

export default function Layout({ children }) {
  const theme = useMantineTheme()
  const [opened, setOpened] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut } = useAuth()

  const MainLink = ({ icon: Icon, color, label, to }) => (
    <UnstyledButton
      sx={(theme) => ({
        display: 'block',
        width: '100%',
        padding: theme.spacing.xs,
        borderRadius: theme.radius.sm,
        color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,
        backgroundColor: location.pathname === to ? 
          theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0]
          : 'transparent',
        '&:hover': {
          backgroundColor:
            theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
        },
      })}
      onClick={() => {
        navigate(to)
        setOpened(false)
      }}
    >
      <Group>
        <ThemeIcon color={color} variant="light">
          <Icon size={18} />
        </ThemeIcon>
        <Text size="sm">{label}</Text>
      </Group>
    </UnstyledButton>
  )

  return (
    <AppShell
      styles={{
        main: {
          background: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0],
        },
      }}
      navbarOffsetBreakpoint="sm"
      navbar={
        <Navbar
          p="md"
          hiddenBreakpoint="sm"
          hidden={!opened}
          width={{ sm: 200, lg: 250 }}
        >
          <Stack justify="space-between" h="100%">
            <Stack>
              <Text size="xs" color="dimmed" weight={500}>ANA MENÜ</Text>
              {mainLinks.map((link) => (
                <MainLink {...link} key={link.label} />
              ))}
            </Stack>
            
            <Stack>
              <Divider />
              <UnstyledButton
                sx={(theme) => ({
                  display: 'block',
                  width: '100%',
                  padding: theme.spacing.xs,
                  borderRadius: theme.radius.sm,
                  color: theme.colors.red[6],
                  '&:hover': {
                    backgroundColor:
                      theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
                  },
                })}
                onClick={signOut}
              >
                <Group>
                  <ThemeIcon color="red" variant="light">
                    <IconLogout size={18} />
                  </ThemeIcon>
                  <Text size="sm">Çıkış Yap</Text>
                </Group>
              </UnstyledButton>
            </Stack>
          </Stack>
        </Navbar>
      }
      header={
        <Header height={{ base: 50, md: 60 }} p="md">
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <MediaQuery largerThan="sm" styles={{ display: 'none' }}>
              <Burger
                opened={opened}
                onClick={() => setOpened((o) => !o)}
                size="sm"
                color={theme.colors.gray[6]}
                mr="xl"
              />
            </MediaQuery>

            <Group>
              <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }}>
                <IconCar size={20} />
              </ThemeIcon>
              <Text weight={700} size="lg" color="indigo">E-Auto</Text>
            </Group>
          </div>
        </Header>
      }
    >
      {children}
    </AppShell>
  )
} 