import React, { useEffect, useRef, useState } from 'react'
import { DialogProps } from '@material-ui/core/Dialog'
import { GenericContent } from '@sensenet/default-content-types'
import {
  Button,
  createStyles,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  makeStyles,
  Theme,
  Typography,
} from '@material-ui/core'
import CloseIcon from '@material-ui/icons/Close'
import NoteAddSharpIcon from '@material-ui/icons/NoteAddSharp'
import { DropFileArea } from '../../DropFileArea'
import { FileList } from './file-list'
import { FileWithFullPath, getAllFileEntries } from './helper'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    closeButton: {
      position: 'absolute',
      right: theme.spacing(1),
      top: theme.spacing(1),
      color: theme.palette.grey[500],
    },
    icon: {
      fontSize: '4rem',
    },
    grid: {
      height: '85vh',
      border: 'dashed',
      borderColor: theme.palette.grey[500],
      marginBottom: theme.spacing(2),
      overflowY: 'auto',
    },
    body1: {
      fontSize: '2.5rem',
    },
    body2: {
      fontSize: '2rem',
    },
  }),
)

type Props = {
  dialogProps: DialogProps
  content: GenericContent
  files?: File[]
}

export const UploadDialog: React.FunctionComponent<Props> = props => {
  const classes = useStyles()
  const inputFile = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<FileWithFullPath[] | undefined>()

  useEffect(() => {
    setFiles(props.files)
  }, [props.files])

  const isFileAdded = files && !!files.length

  const removeItem = (file: File) => {
    if (!files) {
      return
    }
    setFiles(files.filter(f => f !== file))
  }

  const addFiles = (fileList: FileWithFullPath[]) => {
    const noDuplicateFiles =
      files && files.length
        ? [...files, ...fileList.filter(file => !files.some(f2 => f2.size === file.size && f2.name === file.name))]
        : fileList
    setFiles(noDuplicateFiles)
  }

  const onDrop = async (event: React.DragEvent) => {
    const items = await getAllFileEntries(event.dataTransfer.items)
    const result: Array<Promise<FileWithFullPath>> = []
    items.forEach(item => {
      result.push(
        new Promise<FileWithFullPath>(resolve => {
          item.file(file => {
            // No need to add fullPath to file if it wasn't in a folder
            if (`/${file.name}` !== item.fullPath) {
              ;(file as any).fullPath = item.fullPath
            }
            resolve(file as FileWithFullPath)
          })
        }),
      )
    })
    addFiles(await Promise.all(result))
  }

  return (
    <Dialog {...props.dialogProps} disablePortal fullScreen>
      <DialogTitle disableTypography>
        <Typography variant="h6" align="center">
          Upload files
        </Typography>
        {props.dialogProps.onClose ? (
          <IconButton
            aria-label="close"
            className={classes.closeButton}
            onClick={() => props.dialogProps.onClose && props.dialogProps.onClose({}, 'escapeKeyDown')}>
            <CloseIcon />
          </IconButton>
        ) : null}
      </DialogTitle>
      <DialogContent>
        <DropFileArea parentContent={props.content} onDrop={onDrop}>
          <Grid
            onClick={() => inputFile.current && inputFile.current.click()}
            container
            justify={isFileAdded ? 'flex-start' : 'center'}
            direction="column"
            alignItems={isFileAdded ? 'stretch' : 'center'}
            className={classes.grid}>
            {isFileAdded ? (
              <FileList files={files!} removeItem={removeItem} />
            ) : (
              <>
                <NoteAddSharpIcon className={classes.icon} />
                <Typography variant="body1" className={classes.body1}>
                  Select files to upload
                </Typography>
                <Typography variant="body2" className={classes.body2}>
                  or drag and drop
                </Typography>
              </>
            )}
          </Grid>
        </DropFileArea>
        <Grid container justify="flex-end">
          <Button color="primary" variant="contained">
            Upload
          </Button>
        </Grid>
      </DialogContent>
      <input
        onChange={ev => ev.target.files && addFiles([...ev.target.files])}
        style={{ display: 'none' }}
        ref={inputFile}
        type="file"
        accept=""
        multiple={true}
      />
    </Dialog>
  )
}
