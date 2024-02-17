import { useState, MouseEvent, KeyboardEvent, Fragment } from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import WarningIcon from '@mui/icons-material/Warning';
import GPUWarning from './GpuWarning';

type Anchor = 'top' | 'left' | 'bottom' | 'right';

interface WarningDrawerProps {
  anchor: Anchor;
  gpus: string[];
}

export default function GPUWarningDrawer({ anchor, gpus }: WarningDrawerProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const toggleDrawer =
    (open: boolean) => (event: KeyboardEvent | MouseEvent) => {
      if (
        event.type === 'keydown' &&
        ((event as KeyboardEvent).key === 'Tab' ||
          (event as KeyboardEvent).key === 'Shift')
      ) {
        return;
      }

      setIsDrawerOpen(open);
    };

  const list = () => (
    <Box
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <div>
        <GPUWarning gpus={gpus} />
        <Divider />
      </div>
    </Box>
  );

  return (
    <div>
      <Fragment key={anchor}>
        <Chip
          variant="filled"
          label="Warning"
          icon={<WarningIcon />}
          size="medium"
          color="warning"
          onClick={toggleDrawer(true)}
        />
        <Drawer
          className="gpu-warning-drawer"
          anchor={anchor}
          open={isDrawerOpen}
          onClose={toggleDrawer(false)}
        >
          {list()}
        </Drawer>
      </Fragment>
    </div>
  );
}
