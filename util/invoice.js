import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  body: {
    fontSize: 12,
  },
});

const MyDocument = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>My PDF Document</Text>
      <View>
        <Text style={styles.body}>
          This is an example of a PDF generated with @react-pdf/renderer.
        </Text>
      </View>
    </Page>
  </Document>
);

export default MyDocument;