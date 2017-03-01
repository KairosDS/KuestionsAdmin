Json = new FilesCollection({
  collectionName: 'Json',
  allowClientCode: false, // Disallow remove files from Client
  onBeforeUpload: function (file) {
    // Allow upload files under 10MB, and only in png/jpg/jpeg formats
    if (file.size <= 2097152 && /json/i.test(file.extension)) {
      return true;
    } else {
      return 'Solo se pueden subir archivos JSON, con un tamaño menor o igual a 2MB';
    }
  }
});