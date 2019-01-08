export default interface FileFilter {
  accept(archivePath: string): boolean;
  acceptDir(archivePath: string): boolean;
}
